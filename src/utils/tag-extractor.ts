import { normalizeLineEndings } from '../encoders/text-decoder';

/**
 * Extracts content between tags and decodes as needed
 */
export function extractTagContent(
	content: string,
	tagName: string,
): string | null {
	const regex = new RegExp(
		`<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>`,
		'i',
	);
	const match = regex.exec(content);

	if (!match) return null;

	return normalizeLineEndings(match[1]);
}

/**
 * Extracts content between XML-like tags, preserving binary headers
 * For handling cases like ^E^@^@^@<Q_TITLE>...</Q_TITLE>
 */
export function extractInnerTagContent(
	content: string,
	tagName: string,
): { headerBytes: string; tagContent: string } | null {
	// This regex looks for a tag with optional binary data before it
	// It captures both any binary prefix and the content between tags
	const regex = new RegExp(
		`([\x00-\x1F]*)(<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>)`,
		'i',
	);
	const match = regex.exec(content);

	if (!match) return null;

	const headerBytes = match[1] || ''; // Binary header before tag (if any)
	const tagContent = match[3].trim(); // Content between tags

	return {
		headerBytes,
		tagContent: normalizeLineEndings(tagContent),
	};
}

/**
 * Extracts tag content from decoded question HTML
 * Used to extract Q_TITLE, options, etc. from question content
 */
export function extractTagFromHtml(
	html: string,
	tagName: string,
): { rawTag: string; content: string } | null {
	const regex = new RegExp(
		`<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>`,
		'i',
	);
	const match = regex.exec(html);

	if (!match) return null;

	return {
		rawTag: match[0], // The full tag including brackets
		content: match[1].trim(), // Just the content between tags
	};
}
