# cvmaker-mcp

A local [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that bridges AI assistants (Claude Desktop, Cursor, etc.) with the [CV Maker](https://resume.nigamelastic.com/) app to generate pixel-perfect CV PDFs.

## How it works

1. You describe your background to an AI assistant (e.g. Claude Desktop)
2. The AI structures your information and calls this MCP tool
3. A local headless browser visits [resume.nigamelastic.com](https://resume.nigamelastic.com/), injects your CV data, and captures an A4 PDF using the site's print stylesheet
4. The PDF is saved to your machine's temp folder and the path is returned

**🔒 Privacy first:** Your CV data is injected into a local browser's `localStorage` and is **never sent to any external server.**

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An MCP-compatible AI client:
  - [Claude Desktop](https://claude.ai/download)
  - [Cursor](https://www.cursor.com/)
  - Any client supporting the MCP stdio transport

## Installation

```bash
git clone https://github.com/nigamelastic/cvmaker_mcp.git
cd cvmaker_mcp
npm install
```

> `npm install` will automatically download Chromium (~170MB) via Puppeteer. This is a one-time step.

## Configuration

### Claude Desktop

Add the following to your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cvmaker": {
      "command": "node",
      "args": ["/absolute/path/to/cvmaker_mcp/src/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/cvmaker_mcp` with the actual path where you cloned this repo.

### Cursor

Add the same block to your Cursor MCP settings (`.cursor/mcp.json` in your project or global config).

## Usage

Once configured and Claude Desktop is restarted, you can use natural language:

> *"Create a CV for a Senior React Developer with 8 years of experience at Google and Meta. Use the tech template."*

> *"Here's my LinkedIn summary: [paste text]. Build me a CV PDF using the elegant template."*

## Available Templates

| Template | Description |
|---|---|
| `standard` | Clean, traditional single-column layout |
| `modern` | Contemporary design with accent colours |
| `minimal` | Ultra-clean, whitespace-focused |
| `elegant` | Sophisticated serif-accented layout |
| `sidebar` | Two-column with a dark sidebar |
| `tech` | Developer-focused, monospace accents |

## Tool Reference

### `generate_cv_pdf`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `cv.personal` | object | ✅ | Name, title, email, phone, website, location, summary |
| `cv.experience` | array | ✅ | List of `{ role, company, period, description }` |
| `cv.education` | array | ✅ | List of `{ degree, school, period }` |
| `cv.skills` | array | ✅ | List of skill strings |
| `cv.customSections` | array | — | Up to 4 custom `{ title, content }` sections |
| `cv.activeTemplate` | string | — | Template name (default: `standard`) |
| `output_filename` | string | — | PDF filename without extension |

**Returns:** File path to the generated PDF on your local machine.

## Security

- HTML tags are stripped from all string inputs before injection
- Prototype pollution keys (`__proto__`, `constructor`) are blocked
- Payload size is capped at 100KB
- The target URL is hardcoded — it cannot be overridden by tool input
- Generated PDFs are written to your OS temp directory (`/tmp` on Linux/macOS)

## License

[MIT](LICENSE) © nigamelastic
