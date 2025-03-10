import { normalizeLineEndings } from '../encoders/text-decoder';

/**
 * Extracts and decodes numbered blocks like <0>...</0>
 */
export function extractNumberedBlocks(content: string): Map<string, string> {
	const results = new Map<string, string>();
	const regex = /<(\d+)>\s*([\s\S]*?)\s*<\/\1>/g;

	let match;
	while ((match = regex.exec(content)) !== null) {
		const id = match[1];
		const blockContent = normalizeLineEndings(match[2]);
		results.set(id, blockContent);
	}

	return results;
}

/**
 * Determines if content is purely numeric
 * For tags that should not be decoded
 */
export function isPurelyNumeric(content: string): boolean {
	// Clean up whitespace and check if content contains only digits and whitespace
	return /^[\d\s]+$/.test(content);
}
