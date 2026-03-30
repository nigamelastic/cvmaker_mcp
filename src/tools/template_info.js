import { TEMPLATES } from '../schema.js';

export function registerTemplateInfo(server) {
    server.tool(
        'get_available_templates',
        `Fetches a list of valid template string IDs supported by CV Maker.`,
        {},
        async () => {
            return {
                content: [{ type: 'text', text: `Currently available templates:\n[ ${TEMPLATES.join(', ')} ]\nYou can use any of these strings for the 'activeTemplate' field.` }]
            };
        }
    );
}
