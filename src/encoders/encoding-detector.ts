/**
 * Encoding detection utility for handling different character encodings
 */

/**
 * Detects the likely encoding of a buffer
 * Basic implementation that checks for:
 * > byte order marks (BOM)
 * > buffer content to determine encodings
 *
 * @param buffer The file buffer to analyze
 * @returns The detected encoding string (e.g., 'utf8', 'win1251')
 */
export function detectEncoding(buffer: Buffer): string {
    // UTF-8 BOM
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xef &&
        buffer[1] === 0xbb &&
        buffer[2] === 0xbf
    ) {
        return 'utf8';
    }

    // UTF-16 LE BOM
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        return 'utf16le';
    }

    // UTF-16 BE BOM
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
        return 'utf16be';
    }

    // analyze content to determine if it's likely win-1251
    // win-1251 is common for cyrillic text
    let cyrillic = 0;
    let ascii = 0;

    // sample the buffer to find cyrillic characters
    const sampleSize = Math.min(buffer.length, 1000);
    for (let i = 0; i < sampleSize; i++) {
        const byte = buffer[i];
        if (byte >= 0x20 && byte <= 0x7e) {
            ascii++;
        } else if (
            (byte >= 0xc0 && byte <= 0xff) ||
            byte === 0xa8 ||
            byte === 0xb8
        ) {
            // common win-1251 Cyrillic character ranges
            cyrillic++;
        }
    }

    // if we have a significant number of cyrillic characters, assume win-1251
    if (cyrillic > ascii * 0.1) {
        return 'win1251';
    }

    // default to UTF-8 if no specific encoding is detected
    return 'utf8';
}
