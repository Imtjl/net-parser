import * as fs from 'fs';
import * as iconv from 'iconv-lite';

interface TextFixerOptions {
	sourceEncoding?: string;
	targetEncoding?: string;
	debug?: boolean;
}

/**
 * Tries to fix encoding issues in a text file
 * Handles common problems like Windows-1251 text being read incorrectly
 */
export function fixTextEncoding(
	inputPath: string,
	outputPath: string,
	options: TextFixerOptions = {},
): void {
	const {
		sourceEncoding = 'latin1',
		targetEncoding = 'win1251',
		debug = false,
	} = options;

	try {
		if (debug) console.log(`Reading file: ${inputPath}`);

		// Read the file content
		const content = fs.readFileSync(inputPath, 'latin1');

		// Detect if the file likely has encoding issues
		const hasEncodingIssues = detectEncodingIssues(content);

		if (hasEncodingIssues || options.sourceEncoding) {
			if (debug) console.log(`Detected encoding issues, attempting to fix`);

			// Use iconv-lite to convert encoding
			const buffer = iconv.encode(content, sourceEncoding);
			const fixedContent = iconv.decode(buffer, targetEncoding);

			// Write the fixed content
			fs.writeFileSync(outputPath, fixedContent);

			if (debug)
				console.log(`Fixed encoding issues and saved to: ${outputPath}`);
		} else {
			if (debug)
				console.log(`No encoding issues detected, saving original content`);
			fs.writeFileSync(outputPath, content);
		}
	} catch (error) {
		console.error(`Error fixing text encoding:`, error);
		throw error;
	}
}

/**
 * Attempts to detect encoding issues by looking for common patterns of misencoded Cyrillic
 */
function detectEncodingIssues(content: string): boolean {
	// Common patterns that indicate encoding issues with Cyrillic text
	const cyrillicPatterns = [
		/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß]/, // Upper half of Latin-1 space often used for Cyrillic
		/[àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/, // Lower half issues
		/[ÀÁÂÃÄÅàáâãäå].*[ÆÇÈÉÊËæçèéêë]/, // Common combinations
	];

	// Check for typical tag patterns with encoding issues
	return cyrillicPatterns.some((pattern) => pattern.test(content));
}

/**
 * Command-line interface for text fixer
 */
export function runTextFixerCli(): void {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.log(`
Text Encoding Fixer

Usage: text-fixer <input-file> [output-file] [options]

Options:
  --source=<encoding>   Source encoding (default: latin1)
  --target=<encoding>   Target encoding (default: win1251)
  --debug               Enable debug output

Example:
  text-fixer input.txt output.txt --source=latin1 --target=win1251
`);
		return;
	}

	const inputPath = args[0];
	const outputPath = args[1] || `${inputPath}.fixed.txt`;
	const debug = args.includes('--debug');

	// Parse encoding options
	const sourceArg = args.find((a) => a.startsWith('--source='));
	const targetArg = args.find((a) => a.startsWith('--target='));

	const sourceEncoding = sourceArg ? sourceArg.split('=')[1] : 'latin1';
	const targetEncoding = targetArg ? targetArg.split('=')[1] : 'win1251';

	try {
		fixTextEncoding(inputPath, outputPath, {
			sourceEncoding,
			targetEncoding,
			debug,
		});
		console.log(`Text encoding fixed: ${outputPath}`);
	} catch (error) {
		console.error(`Failed to fix text encoding:`, error);
		process.exit(1);
	}
}

// Run CLI if this file is executed directly
if (require.main === module) {
	runTextFixerCli();
}
