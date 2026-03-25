/**
 * sanitize.js — Security helpers mirroring cvmaker/src/utils/security.js
 *
 * CV data is injected directly into a live browser's localStorage.
 * We sanitize before injection to prevent XSS and prototype pollution,
 * even though the site itself also sanitizes on import.
 */

/**
 * Strip HTML tags from a string.
 * @param {string} str
 * @returns {string}
 */
export function stripHTMLTags(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '');
}

/**
 * Recursively sanitize an object:
 *  - Strips HTML from all strings
 *  - Blocks prototype pollution keys (__proto__, constructor)
 *  - Handles arrays and nested objects
 *
 * @param {unknown} data
 * @returns {unknown}
 */
export function sanitizeData(data) {
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (data !== null && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue; // block prototype pollution
            }
            sanitized[key] = sanitizeData(value);
        }
        return sanitized;
    }
    if (typeof data === 'string') {
        return stripHTMLTags(data);
    }
    return data;
}

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100 KB

/**
 * Enforce a maximum JSON payload size to prevent runaway input.
 * @param {unknown} data
 * @throws {Error} if the serialized size exceeds the limit
 */
export function assertPayloadSize(data) {
    const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (size > MAX_PAYLOAD_BYTES) {
        throw new Error(
            `CV payload is too large (${size} bytes). Maximum allowed is ${MAX_PAYLOAD_BYTES} bytes.`
        );
    }
}
