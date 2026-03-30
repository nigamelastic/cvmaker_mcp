# cvmaker-mcp

A local [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that bridges AI assistants (Claude Desktop, Cursor, etc.) with the [CV Maker](https://resume.nigamelastic.com/) app to generate pixel-perfect CV PDFs.

## How it works

1. You describe your background to an AI assistant (e.g. Claude Desktop)
2. The AI structures your information and calls this MCP tool
3. The AI will explicitly ask where you want the final PDF saved, ensuring total control over the output destination.
4. A local headless browser securely visits [resume.nigamelastic.com](https://resume.nigamelastic.com/), computationally injects your CV data locally (without transmitting to any backend server), and captures the resume in PDF format.
5. In addition to PDFs, the AI can securely save or load your structured "profiles" as `.cv.json` files directly to your hard drive, bypassing cloud storage entirely.

**🔒 Privacy first:** Your CV data is injected into a local browser's `localStorage` and is **never sent to any external server.**

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An MCP-compatible AI client:
  - [Claude Desktop](https://claude.ai/download)
  - [Cursor](https://www.cursor.com/)
  - Any client supporting the MCP stdio transport

## Quick Start (No Install)

You can run the MCP server directly using `npx` in your MCP client configuration (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "cvmaker": {
      "command": "npx",
      "args": ["-y", "@nigamelastic/cvmaker-mcp"]
    }
  }
}
```

> [!TIP]
> **Smart Browser Detection**: The first time you run this, it will check for a system browser (Chrome/Brave/Chromium). If none is found, it will automatically download a lightweight version (~130MB) and notify you via logs.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An MCP-compatible AI client:
  - [Claude Desktop](https://claude.ai/download)
  - [Cursor](https://www.cursor.com/)
  - Any client supporting the MCP stdio transport

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
      "command": "npx",
      "args": ["-y", "@nigamelastic/cvmaker-mcp"]
    }
  }
}
```

### Development / Manual Installation

If you prefer to run from source:

```bash
git clone https://github.com/nigamelastic/cvmaker_mcp.git
cd cvmaker_mcp
npm install
node src/index.js
```

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
| `europass` | Traditional, highly structured European standardized layout |
| `executive` | Formal, dense layout optimized for extensive senior experience |

## Tool Reference

### `generate_cv_pdf`
Generates a pixel-perfect A4 PDF using the CV Maker engine natively.
| Parameter | Type | Required | Description |
|---|---|---|---|
| `cv.personal` | object | ✅ | Name, title, email, phone, website, location, summary |
| `cv.experience` | array | ✅ | List of `{ role, company, period, description }` |
| `cv.education` | array | ✅ | List of `{ degree, school, period }` |
| `cv.skills` | array | ✅ | List of skill strings |
| `cv.customSections` | array | — | Up to 4 custom `{ title, content }` sections |
| `cv.activeTemplate` | string | — | Template name (default: `standard`) |
| `destination_dir` | string | ✅ | Absolute directory path where you want the PDF saved |
| `output_filename` | string | — | PDF filename without extension |

**Returns:** File path to the generated PDF on your local machine.

### `export_cv_json`
Saves the structured CV JSON to a local file in `~/.cvmaker-profiles/`. Perfect for saving "profiles" to iterate on later.
| Parameter | Type | Required | Description |
|---|---|---|---|
| `cv` | object | ✅ | structured CV JSON Payload |
| `output_filename` | string | — | Desired profile filename without extension |

### `import_cv_json`
Loads a previously saved CV JSON profile from your hard drive structure back into the AI context.
| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_path` | string | ✅ | Absolute absolute path to the `.cv.json` file |

### `get_live_preview_url`
Generates a payload or standalone file locally for previewing the CV JSON on `resume.nigamelastic.com`.
| Parameter | Type | Required | Description |
|---|---|---|---|
| `cv` | object | ✅ | structured CV JSON Payload |

### `extract_resume_data`
A helper tool for validating AI-extracted resume/LinkedIn text explicitly against the strict CV JSON Schema before doing heavier rendering operations.
| Parameter | Type | Required | Description |
|---|---|---|---|
| `cv` | object | ✅ | structured CV JSON Payload |

### `get_available_templates`
Fetches a list of valid template string IDs supported by CV Maker without requiring manual code inspection.



## Warranty and Liability Disclaimer

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

**Use of third-party site:** This MCP server interacts with `https://resume.nigamelastic.com/`. While this server sanitizes data locally before injection, the user acknowledges that they are responsible for the content they process and that the final PDF rendering occurs within a headless browser instance.

## License

[MIT](LICENSE) © nigamelastic
