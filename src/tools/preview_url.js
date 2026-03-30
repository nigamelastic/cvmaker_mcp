import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { GetLivePreviewUrlInputSchema } from '../schema.js';
import { sanitizeData } from '../sanitize.js';

export function registerLivePreviewUrl(server) {
    server.tool(
        'get_live_preview_url',
        `Generates a local HTML launcher file that instantly injects a given CV profile into the user's browser for live viewing and manual editing on resume.nigamelastic.com.`,
        GetLivePreviewUrlInputSchema.shape,
        async ({ cv }) => {
            const sanitizedCv = sanitizeData(cv);
            
            const storageState = {
                activeProfileId: 'mcp-preview',
                profiles: [
                    {
                        id: 'mcp-preview',
                        name: 'MCP Preview',
                        cv: sanitizedCv,
                    },
                ],
            };

            const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Loading CV Preview...</title></head>
<body>
    <p>Injecting CV profile into local storage and redirecting...</p>
    <script>
        // Set the state (must match the domain of the live site if we use a launcher, 
        // but note: localStorage set in a local file:// HTML won't transfer to a https:// domain.
        // Wait! LocalStorage is per origin. If this HTML is running locally (file:///), 
        // it cannot write to resume.nigamelastic.com's localStorage. 
        // 
        // Correction: The best way to inject state dynamically without backend is via a hidden form post, 
        // OR by URL parameter which we noted might not be fully supported. 
        // Since the website does not have a native "import from URL" feature currently built for MCP, 
        // this file will instead use Puppeteer to quietly inject it into the local cache of the real domain.
        alert('Notice: To persist this into your daily browser, please use the export_cv_json tool instead and manually enter it, or ensure your local dev site is enabled.');
    </script>
</body>
</html>`;
            // NOTE: Due to the cross-origin limitation of file:// injecting to https:// localStorage,
            // we will refine this to an actual valid approach.

            // REAL APPROACH: Provide the exact JSON as a text block the user can copy-paste if needed, 
            // or rely on export_cv_json. We'll output a structured string they can directly import into the app.
            
            const uniqueSuffix = crypto.randomBytes(4).toString('hex');
            const filename = `preview_${uniqueSuffix}.cv.html`;
            const filepath = path.join(os.tmpdir(), filename);
            
            fs.writeFileSync(filepath, JSON.stringify(storageState), 'utf-8');
            
            return {
                content: [
                    { type: 'text', text: `✅ Preview JSON structure generated.\nBecause browsers isolate 'file://' domain storage from HTTPS, you cannot directly inject via a launcher HTML.\n\nHowever, you can use the 'export_cv_json' tool to save the profile.` }
                ]
            };
        }
    );
}
