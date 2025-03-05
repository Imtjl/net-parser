/**
 * Text decoding utilities for converting between encodings
 */

import iconv from 'iconv-lite';

/**
 * Decode text from a buffer with the specified encoding
 *
 * @param buffer The buffer to decode
 * @param encoding The encoding to use
 * @returns The decoded text
 */
export function decodeText(
    buffer: Buffer | string,
    encoding: string = 'utf8',
): string {
    if (typeof buffer === 'string') {
        return decodeSimpleText(buffer);
    }

    try {
        // Map common encoding names to iconv encoding names
        const iconvEncoding = encoding === 'win1251' ? 'win1251' : encoding;

        // Decode using iconv-lite
        return iconv
            .decode(buffer, iconvEncoding)
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
    } catch (error) {
        // Fallback to UTF-8 if decoding fails
        return buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
}

/**
 * Simple text decoder for handling common escape sequences
 * and other text normalization
 *
 * @param text The text to decode
 * @returns The decoded text
 */
export function decodeSimpleText(text: string): string {
    return text
        .replace(/\\r\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
}
