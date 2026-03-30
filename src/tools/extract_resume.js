import { ExtractResumeDataInputSchema } from '../schema.js';
import { sanitizeData } from '../sanitize.js';

export function registerExtractResume(server) {
    server.tool(
        'extract_resume_data',
        `A helper tool for validating AI-extracted resume/LinkedIn text into a strict CV JSON format. Pass your organically constructed JSON against this to assert validity before generating PDFs or Profiles.`,
        ExtractResumeDataInputSchema.shape,
        async ({ cv }) => {
            try {
                // If it passes zod validation at the shape level, it reaches here.
                const sanitized = sanitizeData(cv);
                return {
                    content: [{ type: 'text', text: `✅ CV payload successfully structured and validated. Ready to be exported or generated as PDF.` }]
                };
            } catch (err) {
                 return { isError: true, content: [{ type: 'text', text: `Validation failed: ${err.message}` }] };
            }
        }
    );
}
