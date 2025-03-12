import fs from 'fs';
import path from 'path';

/**
 * Synchronize images across multiple directories so each directory has all images
 */
export function syncImages(rootDir: string, subDirs: string[] = []): void {
    try {
        // Get all pics directories
        const picsDirs: string[] = [];

        if (subDirs.length > 0) {
            // Use provided subdirectories
            subDirs.forEach((subDir) => {
                const picsDir = path.join(rootDir, subDir, 'pics');
                if (fs.existsSync(picsDir)) {
                    picsDirs.push(picsDir);
                }
            });
        } else {
            // Auto-detect subdirectories with pics folders
            const entries = fs.readdirSync(rootDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const picsDir = path.join(rootDir, entry.name, 'pics');
                    if (fs.existsSync(picsDir)) {
                        picsDirs.push(picsDir);
                    }
                }
            }
        }

        if (picsDirs.length === 0) {
            console.error('No pics directories found!');
            return;
        }

        console.log(
            `Found ${picsDirs.length} pics directories: ${picsDirs.map((d) => path.basename(path.dirname(d))).join(', ')}`,
        );

        // Collect all unique images
        const allImages = new Map<string, string>(); // filename -> source directory

        for (const picsDir of picsDirs) {
            const files = fs.readdirSync(picsDir);

            for (const file of files) {
                // Skip non-image files and Thumbs.db
                if (
                    !/\.(jpg|jpeg|png|gif|bmp|JPG|JPEG|PNG|GIF|BMP)$/i.test(file) ||
                    file === 'Thumbs.db'
                ) {
                    continue;
                }

                // Normalize filename to lowercase for comparison
                const normalizedName = file.toLowerCase();

                if (!allImages.has(normalizedName)) {
                    allImages.set(normalizedName, path.join(picsDir, file));
                }
            }
        }

        console.log(`Found ${allImages.size} unique images across all directories`);

        // Sync images to each directory
        for (const targetDir of picsDirs) {
            const existingFiles = new Set(
                fs
                    .readdirSync(targetDir)
                    .filter((f) => !/Thumbs\.db/i.test(f))
                    .map((f) => f.toLowerCase()),
            );

            let copiedCount = 0;

            // Copy missing images
            for (const [normalizedName, sourceFile] of allImages.entries()) {
                if (!existingFiles.has(normalizedName)) {
                    const targetFile = path.join(targetDir, path.basename(sourceFile));
                    fs.copyFileSync(sourceFile, targetFile);
                    copiedCount++;
                }
            }

            console.log(
                `Copied ${copiedCount} images to ${path.basename(path.dirname(targetDir))}/pics`,
            );
        }

        console.log('Image synchronization completed successfully!');
    } catch (error) {
        console.error('Error syncing images:', error);
    }
}

/**
 * Main function for CLI usage
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log(
            'Usage: node sync-images.js <root-directory> [subdir1 subdir2 ...]',
        );
        console.log(
            'Example: node sync-images.js data/tests test1 test2 test3 exam',
        );
        process.exit(1);
    }

    const rootDir = args[0];
    const subDirs = args.slice(1);

    syncImages(rootDir, subDirs);
}

// If this file is run directly from Node.js
if (require.main === module) {
    main();
}
