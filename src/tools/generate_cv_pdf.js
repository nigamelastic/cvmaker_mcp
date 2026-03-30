import puppeteer from 'puppeteer-core';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { GenerateCvPdfInputSchema, TEMPLATES } from '../schema.js';
import { sanitizeData, assertPayloadSize } from '../sanitize.js';
import { getBrowserExecutable } from '../browser.js';

// The live CV Maker site — hardcoded, never accepted as user input
const CV_MAKER_URL = 'https://resume.nigamelastic.com/';

// localStorage key used by the CV Maker app (useCVData.js → STORAGE_KEY)
const STORAGE_KEY = 'leancv-data-v2';

/**
 * Builds the localStorage state object that the CV Maker React app expects.
 * See: cvmaker/src/hooks/useCVData.js — state shape
 *
 * @param {object} cv — sanitized CV object
 * @returns {object}
 */
function buildStorageState(cv) {
    return {
        activeProfileId: 'mcp-generated',
        profiles: [
            {
                id: 'mcp-generated',
                name: 'MCP Generated',
                cv,
            },
        ],
    };
}

/**
 * Registers the generate_cv_pdf tool on the given McpServer.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerGenerateCvPdf(server) {
    server.tool(
        'generate_cv_pdf',
        `Generate a pixel-perfect PDF of a CV/resume using the CV Maker app at ${CV_MAKER_URL}.

The tool accepts a structured CV JSON object and an optional template name, then:
1. Launches a local headless browser
2. Navigates to the live CV Maker site
3. Injects the CV data into the browser's localStorage (data never leaves this machine)
4. Waits for the React app to render the CV preview
5. Exports the rendered page as an A4 PDF with print backgrounds
6. Saves the PDF to a temp file and returns the file path

Available templates: ${TEMPLATES.join(', ')}`,
        GenerateCvPdfInputSchema.shape,
        async ({ cv, destination_dir, output_filename }) => {
            const validatedCv = cv;
            const rawFilename = output_filename;

            // ── 2. Enforce payload size cap (100KB) ───────────────────────────
            try {
                assertPayloadSize(validatedCv);
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: err.message }],
                };
            }

            // ── 3. Sanitize — strip HTML, block prototype pollution ────────────
            const sanitizedCv = sanitizeData(validatedCv);

            // ── 4. Build output file path ─────────────────────────────────────
            const nameSlug = (rawFilename || sanitizedCv.personal.fullName || 'cv')
                .replace(/[^a-z0-9_\-]/gi, '_')
                .slice(0, 100);
            const uniqueSuffix = crypto.randomBytes(4).toString('hex');
            const filename = `${nameSlug}_${uniqueSuffix}.pdf`;
            
            // Resolve directory or fallback to tmpdir just in case
            const destDir = destination_dir ? path.resolve(destination_dir) : os.tmpdir();
            if (destination_dir && !fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            const outputPath = path.join(destDir, filename);

            // ── 5. Launch headless browser ────────────────────────────────────
            let browser;
            try {
                const executablePath = await getBrowserExecutable();
                
                browser = await puppeteer.launch({
                    executablePath,
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                    ],
                });

                const page = await browser.newPage();

                // ── 6. Load the site and inject CV data into localStorage ─────
                // We need to navigate first so we have a valid origin for localStorage
                await page.goto(CV_MAKER_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

                const storageState = buildStorageState(sanitizedCv);
                await page.evaluate(
                    (key, value) => localStorage.setItem(key, JSON.stringify(value)),
                    STORAGE_KEY,
                    storageState
                );

                // ── 7. Reload so the React app picks up the new localStorage ──
                await page.reload({ waitUntil: 'networkidle0', timeout: 30_000 });

                // ── 8. Wait for the CV preview to render ──────────────────────
                // The preview panel renders inside a scrollable aside / div.
                // We wait for any template-specific element to confirm render.
                await page.waitForSelector('.cv-preview, [class*="template"], [class*="cv-"]', {
                    timeout: 15_000,
                });

                // Small buffer to allow fonts and CSS to fully paint
                await new Promise(resolve => setTimeout(resolve, 800));

                // ── 9. Print to PDF ───────────────────────────────────────────
                // Using Puppeteer's native PDF generation creates a lean, vector-based PDF (perfect for ATS),
                // while relying on the exact @media print CSS rules we perfected in the main app.
                await page.pdf({
                    path: outputPath,
                    printBackground: true,
                    preferCSSPageSize: true, // Respects @page { size: A4; margin: 10mm; }
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: [
                                `✅ CV PDF generated successfully!`,
                                `📄 File saved to: ${outputPath}`,
                                `👤 Name: ${sanitizedCv.personal.fullName}`,
                                `🎨 Template: ${sanitizedCv.activeTemplate}`,
                                ``,
                                `Open the file with your PDF viewer, or on Linux: xdg-open "${outputPath}"`,
                            ].join('\n'),
                        },
                    ],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Failed to generate PDF: ${err.message}\n\nMake sure ${CV_MAKER_URL} is accessible and that Node.js 18+ is installed.`,
                        },
                    ],
                };
            } finally {
                if (browser) await browser.close();
            }
        }
    );
}
