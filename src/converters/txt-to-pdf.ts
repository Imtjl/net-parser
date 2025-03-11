import fs from 'fs';
import path from 'path';
import { convertTxtToMarkdown } from './txt-to-md';
import { convertMarkdownToPdf } from './md-to-pdf';

/**
 * Convert FDB-parsed TXT file directly to PDF
 */
export async function convertTxtToPdf(
    inputPath: string,
    outputPath: string,
    options?: {
        imageBasePath?: string;
        cssPath?: string;
        keepMarkdown?: boolean;
    },
): Promise<void> {
    try {
        const tempMarkdownPath = options?.keepMarkdown
            ? outputPath.replace(/\.pdf$/i, '.md')
            : path.join(path.dirname(outputPath), `temp-${Date.now()}.md`);

        convertTxtToMarkdown(inputPath, tempMarkdownPath, options?.imageBasePath);

        await convertMarkdownToPdf(tempMarkdownPath, outputPath, {
            cssPath: options?.cssPath,
            imageBasePath: path.dirname(tempMarkdownPath), // Use MD file directory as base path
        });

        if (!options?.keepMarkdown && fs.existsSync(tempMarkdownPath)) {
            fs.unlinkSync(tempMarkdownPath);
            console.log(`Temporary Markdown file deleted: ${tempMarkdownPath}`);
        } else if (options?.keepMarkdown) {
            console.log(`Intermediate Markdown file preserved: ${tempMarkdownPath}`);
        }

        console.log(`Successfully converted ${inputPath} to ${outputPath}`);
    } catch (error) {
        console.error('Error converting TXT to PDF:', error);
        throw error;
    }
}

/**
 * Main function for CLI usage
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(
            'Usage: node txt-to-pdf.js input.txt output.pdf [imageBasePath] [cssPath] [--keep-markdown]',
        );
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const imageBasePath = args[2];
    const cssPath = args[3];
    const keepMarkdown = args.includes('--keep-markdown');

    try {
        await convertTxtToPdf(inputPath, outputPath, {
            imageBasePath,
            cssPath,
            keepMarkdown,
        });
    } catch (error) {
        console.error('Conversion failed:', error);
        process.exit(1);
    }
}

// If this file is run directly from Node.js
if (require.main === module) {
    main();
}
