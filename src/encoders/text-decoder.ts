import * as iconv from 'iconv-lite';

/**
 * Decodes text from one encoding to another
 * @param text The text to decode
 * @param sourceEncoding The source encoding (default: 'latin1')
 * @param targetEncoding The target encoding (default: 'win1251')
 * @returns The decoded text
 */
export function decodeText(
	text: string,
	sourceEncoding: string = 'latin1',
	targetEncoding: string = 'win1251',
): string {
	try {
		const buffer = iconv.encode(text, sourceEncoding);
		return iconv.decode(buffer, targetEncoding);
	} catch (error) {
		console.error('Error decoding text:', error);
		return text;
	}
}

/**
 * Properly normalizes line endings to remove ^M characters
 */
export function normalizeLineEndings(text: string): string {
	// First convert all CR+LF to LF, then convert any remaining CR to LF
	return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
