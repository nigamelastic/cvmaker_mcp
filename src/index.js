#!/usr/bin/env node
/**
 * CV Maker MCP Server
 *
 * Exposes a single tool — generate_cv_pdf — that renders a structured CV JSON
 * into a pixel-perfect A4 PDF using the live CV Maker site at
 * https://resume.nigamelastic.com/
 *
 * Transport: stdio (for use with Claude Desktop, Cursor, and other MCP clients)
 *
 * Privacy: CV data is injected into a local headless browser's localStorage
 * and is NEVER transmitted to any external server.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGenerateCvPdf } from './tools/generate_cv_pdf.js';
import { registerJsonProfileTools } from './tools/json_profile.js';
import { registerLivePreviewUrl } from './tools/preview_url.js';
import { registerTemplateInfo } from './tools/template_info.js';
import { registerExtractResume } from './tools/extract_resume.js';

const server = new McpServer({
    name: 'cvmaker-mcp',
    version: '1.1.0',
});

// Register tools
registerGenerateCvPdf(server);
registerJsonProfileTools(server);
registerLivePreviewUrl(server);
registerTemplateInfo(server);
registerExtractResume(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Stderr is safe to use for diagnostic messages — it doesn't interfere
// with the JSON-RPC stdio protocol
process.stderr.write('CV Maker MCP Server running (stdio)\n');
