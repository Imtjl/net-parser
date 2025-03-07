import * as iconv from 'iconv-lite';

/**
 * Simple function to decode a hex string to text using specified encoding
 * @param hexString The hex string to decode
 * @param encoding The encoding to use (default: win1251)
 * @returns The decoded text
 */
export function decodeHexString(
    hexString: string,
    encoding: string = 'win1251',
): string {
    const cleanHex = hexString.replace(/\s+/g, '');
    const buffer = Buffer.from(cleanHex, 'hex');
    return iconv.decode(buffer, encoding);
}
