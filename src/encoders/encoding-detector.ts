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
	// Check for BOMs first
	if (
		buffer.length >= 3 &&
		buffer[0] === 0xef &&
		buffer[1] === 0xbb &&
		buffer[2] === 0xbf
	)
		return 'utf8';
	if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe)
		return 'utf16le';
	if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff)
		return 'utf16be';

	// Check for Cyrillic patterns
	let hasCyrillic = false;
	for (let i = 0; i < buffer.length; i++) {
		if (buffer[i] >= 0xc0 && buffer[i] <= 0xff) {
			hasCyrillic = true;
			break;
		}
	}

	return buffer.includes(0x00) ? 'utf16le' : hasCyrillic ? 'win1251' : 'utf8';
}
