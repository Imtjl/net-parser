// src/fdb-to-txt.ts
import * as fs from 'fs';
import { extractTagContent, extractTagFromHtml } from '../utils/tag-extractor';
import { decodeHexString, isHexEncoded } from '../encoders/hex-decoder';
import { decodeText, normalizeLineEndings } from '../encoders/text-decoder';
import {
	extractNumberedBlocks,
	isPurelyNumeric,
} from '../utils/block-processor';

/**
 * Simple options for conversion
 */
interface FdbToTxtOptions {
	debug?: boolean;
	encoding?: string;
}

/**
 * Converts an .fdb file to a plain text file
 */
export function convertFdbToTxt(
	inputPath: string,
	outputPath: string,
	options: FdbToTxtOptions = {},
): void {
	const { debug = false, encoding = 'win1251' } = options;

	try {
		if (debug) console.log(`Reading file: ${inputPath}`);

		// Read as binary to preserve all bytes without interpretation
		const rawContent = fs.readFileSync(inputPath, 'latin1');

		// Initialize output content
		let outputContent = '';

		// Array of tags that might just contain numbers and shouldn't be decoded
		const numericTags = ['T_id', 'tv_p', 'tv_d'];

		// Process standard tags
		const tags = [
			'T_head',
			'T_id',
			'T_title',
			'tv_i',
			'tv_p',
			'tv_d',
			'info-id',
			'intro-id',
		];

		for (const tag of tags) {
			let rawTagContent = extractTagContent(rawContent, tag);

			if (rawTagContent !== null) {
				let processedContent;

				// If this is a numeric-only tag, don't try to decode it
				if (numericTags.includes(tag) && isPurelyNumeric(rawTagContent)) {
					if (debug) console.log(`Preserving numeric content for <${tag}>`);
					processedContent = rawTagContent;
				}
				// If content is hex-encoded, decode it
				else if (isHexEncoded(rawTagContent)) {
					if (debug) console.log(`Decoding hex content for <${tag}>`);
					processedContent = decodeHexString(rawTagContent, encoding);
				}
				// Otherwise, treat as text that needs encoding correction
				else {
					if (debug) console.log(`Decoding text content for <${tag}>`);
					processedContent = decodeText(rawTagContent, 'latin1', encoding);
				}

				outputContent += `<${tag}>\n${processedContent}\n</${tag}>\n\n`;
			}
		}

		// Process T_body separately
		const bodyContent = extractTagContent(rawContent, 'T_body');

		if (bodyContent !== null) {
			outputContent += '<T_body>\n';

			const blocks = extractNumberedBlocks(bodyContent);

			for (const [id, blockContent] of blocks.entries()) {
				let decodedBlock;

				if (isHexEncoded(blockContent)) {
					if (debug) console.log(`Decoding hex content for question ${id}`);
					decodedBlock = decodeHexString(blockContent, encoding);

					// Normalize line endings to remove ^M characters
					const normalizedContent = normalizeLineEndings(decodedBlock);

					outputContent += `<${id}>\n${normalizedContent}\n</${id}>\n\n`;
				} else {
					// Non-hex content (unlikely but handle it)
					outputContent += `<${id}>\n${blockContent}\n</${id}>\n\n`;
				}
			}

			outputContent += '</T_body>\n\n';
		}

		// Process gr-id separately
		const grIdContent = extractTagContent(rawContent, 'gr-id');

		if (grIdContent !== null) {
			let processedGrId;

			if (isHexEncoded(grIdContent)) {
				if (debug) console.log(`Decoding hex content for <gr-id>`);
				processedGrId = decodeHexString(grIdContent, encoding);
			} else {
				processedGrId = grIdContent;
			}

			processedGrId = normalizeLineEndings(processedGrId);

			outputContent += `<gr-id>\n${processedGrId}\n</gr-id>\n\n`;
		}

		// Write output to file, ensuring consistent line endings
		fs.writeFileSync(outputPath, outputContent);

		if (debug) console.log(`Converted file written to: ${outputPath}`);
	} catch (error) {
		console.error('Error converting file:', error);
		throw error;
	}
}

/**
 * Simple CLI function
 */
export function runCli(): void {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.log(
			'Usage: fdb-to-txt <input-file> [output-file] [--debug] [--encoding=win1251]',
		);
		return;
	}

	const inputPath = args[0];
	const outputPath = args[1] || `${inputPath}.txt`;
	const debug = args.includes('--debug');

	// Parse encoding option
	const encodingArg = args.find((a) => a.startsWith('--encoding='));
	const encoding = encodingArg ? encodingArg.split('=')[1] : 'win1251';

	try {
		convertFdbToTxt(inputPath, outputPath, { debug, encoding });
		console.log(`Successfully converted ${inputPath} to ${outputPath}`);
	} catch (error) {
		console.error('Conversion failed:', error);
		process.exit(1);
	}
}

// Make sure this is at the end of your file
if (require.main === module) {
	console.log('Starting FDB to TXT conversion');
	runCli();
}
