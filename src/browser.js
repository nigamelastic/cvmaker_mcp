import { detectBrowserPlatform, install, resolveBuildId, Browser } from '@puppeteer/browsers';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const CACHE_DIR = path.join(os.homedir(), '.cache', 'cvmaker-mcp');
const CHROME_PATHS = {
    linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
    ],
    darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
};

/**
 * Finds a system browser or downloads one if necessary.
 * @returns {Promise<string>} Path to the executable.
 */
export async function getBrowserExecutable() {
    // 1. Check environment variable
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // 2. Check common system paths
    const platform = os.platform();
    const paths = CHROME_PATHS[platform] || [];
    
    for (const p of paths) {
        if (fs.existsSync(p)) {
            process.stderr.write(`[cvmaker-mcp] Using system browser: ${p}\n`);
            return p;
        }
    }

    // 3. Check 'which' command as fallback
    try {
        const whichChrome = execSync('which google-chrome', { encoding: 'utf8' }).trim();
        if (whichChrome) return whichChrome;
    } catch (e) {}

    // 4. Download Chromium if none found
    process.stderr.write(`[cvmaker-mcp] No system browser found. Initializing runtime download...\n`);
    
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const browserPlatform = detectBrowserPlatform();
    const browser = Browser.CHROME; // Use Chrome for best compatibility with our PDF rendering
    const buildId = await resolveBuildId(browser, browserPlatform, 'latest');

    const installPath = path.join(CACHE_DIR, buildId);
    const executablePath = path.join(installPath, 'chrome'); // This varies by platform, but @puppeteer/browsers helps

    if (!fs.existsSync(installPath)) {
        process.stderr.write(`[cvmaker-mcp] Downloading Chromium (version: ${buildId}). This only happens once...\n`);
        await install({
            browser,
            buildId,
            cacheDir: CACHE_DIR,
            platform: browserPlatform,
        });
        process.stderr.write(`[cvmaker-mcp] Download complete!\n`);
    }

    // After install, we need to find the actual executable inside the cache
    // The install() call returns the structure, but we can also resolve it
    const installedBrowser = await install({
        browser,
        buildId,
        cacheDir: CACHE_DIR,
        platform: browserPlatform,
    });

    return installedBrowser.executablePath;
}
