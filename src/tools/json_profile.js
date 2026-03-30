import fs from 'fs';
import path from 'path';
import os from 'os';
import { ExportCvJsonInputSchema, ImportCvJsonInputSchema } from '../schema.js';
import { sanitizeData } from '../sanitize.js';

export function registerJsonProfileTools(server) {
    // EXPORT CV
    server.tool(
        'export_cv_json',
        `Save a generated CV to a local JSON file. This acts as a 'profile' you can reload later.`,
        ExportCvJsonInputSchema.shape,
        async ({ cv, output_filename }) => {
            try {
                const sanitizedCv = sanitizeData(cv);
                const nameSlug = (output_filename || sanitizedCv.personal.fullName || 'cv')
                    .replace(/[^a-z0-9_\-]/gi, '_')
                    .slice(0, 100);
                
                // Allow the user's home/desktop or default to temp. Let's just use CWD or /tmp.
                // Since this is meant to be a profile, saving to CWD (where the user runs the MCP) or a specific absolute dir is better.
                // To be safe, let's just use /tmp or a dedicated profile folder in the home directory.
                const profileDir = path.join(os.homedir(), '.cvmaker-profiles');
                if (!fs.existsSync(profileDir)) {
                    fs.mkdirSync(profileDir, { recursive: true });
                }
                
                const filepath = path.join(profileDir, `${nameSlug}.cv.json`);
                fs.writeFileSync(filepath, JSON.stringify(sanitizedCv, null, 2), 'utf-8');
                
                return {
                    content: [
                        { type: 'text', text: `✅ CV Profile saved successfully!\n📄 Location: ${filepath}\nUse import_cv_json to load this profile later.` }
                    ]
                };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Failed to export CV JSON: ${err.message}` }] };
            }
        }
    );

    // IMPORT CV
    server.tool(
        'import_cv_json',
        `Load a previously saved CV JSON profile from your hard drive structure into the context.`,
        ImportCvJsonInputSchema.shape,
        async ({ file_path }) => {
            try {
                if (!fs.existsSync(file_path)) {
                    return { isError: true, content: [{ type: 'text', text: `File not found: ${file_path}` }] };
                }
                const data = fs.readFileSync(file_path, 'utf-8');
                const parsed = JSON.parse(data);
                
                return {
                    content: [
                        { type: 'text', text: `✅ CV Profile loaded successfully:\n\n${JSON.stringify(parsed, null, 2)}` }
                    ]
                };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Failed to import CV JSON: ${err.message}` }] };
            }
        }
    );
}
