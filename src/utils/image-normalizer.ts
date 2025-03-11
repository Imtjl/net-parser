import fs from 'fs';
import path from 'path';

/**
 * Normalize image extensions in a directory (converts .JPG to .jpg)
 * Returns a mapping from original filenames to normalized ones
 */
export function normalizeImageExtensions(
    imageDir: string,
): Record<string, string> {
    const mapping: Record<string, string> = {};

    try {
        // Check if directory exists
        if (!fs.existsSync(imageDir)) {
            console.warn(`Image directory ${imageDir} does not exist`);
            return mapping;
        }

        // Get all files in the directory
        const files = fs.readdirSync(imageDir);

        // Process each file
        for (const file of files) {
            const filePath = path.join(imageDir, file);

            // Skip directories
            if (fs.statSync(filePath).isDirectory()) {
                continue;
            }

            // Check if the file has .JPG extension
            if (file.endsWith('.JPG')) {
                const normalizedName = file.replace(/\.JPG$/, '.jpg');
                const normalizedPath = path.join(imageDir, normalizedName);

                // Create a copy with the normalized extension
                fs.copyFileSync(filePath, normalizedPath);
                console.log(`Normalized ${file} to ${normalizedName}`);

                // Add to mapping
                mapping[file] = normalizedName;
            }
        }

        console.log(
            `Normalized ${Object.keys(mapping).length} image files in ${imageDir}`,
        );

        return mapping;
    } catch (error) {
        console.error('Error normalizing image extensions:', error);
        return mapping;
    }
}

/**
 * Main function for CLI usage
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: node image-normalizer.js path/to/images');
        process.exit(1);
    }

    const imageDir = args[0];
    normalizeImageExtensions(imageDir);
}

// If this file is run directly from Node.js
if (require.main === module) {
    main();
}
