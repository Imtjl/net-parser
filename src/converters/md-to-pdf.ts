import fs from 'fs';
import { mdToPdf } from 'md-to-pdf';

/**
 * Convert Markdown file to PDF
 */
export async function convertMarkdownToPdf(
    inputPath: string,
    outputPath: string,
    options?: {
        cssPath?: string;
        imageBasePath?: string;
    },
): Promise<void> {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file ${inputPath} does not exist`);
        }

        // Read input markdown content
        const markdownContent = fs.readFileSync(inputPath, 'utf8');

        // Prepare md-to-pdf options
        const mdPdfOptions: any = {
            dest: outputPath,
            pdf_options: {
                format: 'A4',
                margin: '0', // Remove margins completely
                printBackground: true,
                displayHeaderFooter: false, // Remove header/footer
            },
            stylesheet_web: true, // Use web-based stylesheet processing
        };

        // Add custom CSS if provided
        if (options?.cssPath && fs.existsSync(options.cssPath)) {
            mdPdfOptions.stylesheet = options.cssPath; // Use file path, not content
        } else {
            // Default CSS for better PDF styling
            mdPdfOptions.css = `
        @page {
          margin: 0;
          padding: 0;
          size: A4;
        }
        
        html, body {
          background-color: #1e1e2e;
          color: #cdd6f4;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          width: 100%;
        }
        
        body {
          font-family: 'Source Sans Pro', sans-serif;
          line-height: 1.4;
          font-size: 14px;
          padding: 20px;
          box-sizing: border-box;
        }
        
        h1 {
          color: #89b4fa;
          padding-bottom: 8px;
          border-bottom: 1px solid #45475a;
          margin-bottom: 1.5em;
        }
        
        h2 {
          color: #89dceb;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.3em;
        }
        
        img {
          max-width: 95%;
          display: block;
          margin: 15px auto;
          border: 1px solid #45475a;
          border-radius: 5px;
        }
        
        /* Highlighted correct answers */
        strong {
          color: #a6e3a1;
          font-weight: 600;
        }
        
        /* Question type info */
        em {
          color: #bac2de;
          font-style: italic;
          font-size: 0.9em;
        }
        
        hr {
          border: 0;
          height: 1px;
          background: #45475a;
          margin: 15px 0;
        }
        
        /* Remove page breaks between questions */
        /* hr + h2 {
          break-before: page;
        } */
      `;
        }

        // Set base path for images if provided
        if (options?.imageBasePath) {
            mdPdfOptions.basedir = options.imageBasePath;
        }

        try {
            // Convert to PDF
            const pdf = await mdToPdf({ content: markdownContent }, mdPdfOptions);

            // Make sure we have data
            if (pdf.content) {
                console.log(`Successfully converted ${inputPath} to ${outputPath}`);
            } else {
                throw new Error('PDF conversion failed with no content');
            }
        } catch (conversionError) {
            console.error('Error in PDF conversion:', conversionError);
            throw conversionError;
        }
    } catch (error) {
        console.error('Error converting Markdown to PDF:', error);
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
            'Usage: node md-to-pdf.js input.md output.pdf [cssPath] [imageBasePath]',
        );
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const cssPath = args[2];
    const imageBasePath = args[3];

    try {
        await convertMarkdownToPdf(inputPath, outputPath, {
            cssPath,
            imageBasePath,
        });
    } catch (error) {
        process.exit(1);
    }
}

// If this file is run directly from Node.js
if (require.main === module) {
    main();
}
