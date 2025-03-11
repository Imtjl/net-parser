import fs from 'fs';
import path from 'path';
import { Task, TestData, TaskType } from '../core/types';
import { parseTxt } from '../core/parser';
import { normalizeImageExtensions } from '../utils/image-normalizer';

/**
 * Convert a task to Markdown format
 */
function taskToMarkdown(task: Task, imageBasePath?: string): string {
    let markdown = `## Question ${task.id} (${task.options.max} points)\n\n`;

    // Add question text
    let questionText = task.question.text;

    // Handle images in question text
    if (task.question.imgUrl && imageBasePath) {
        // Normalize image extension to lowercase .jpg
        const normalizedImageName = task.question.imgUrl
            .replace('pics\\', '')
            .replace('pics/', '')
            .replace(/\.JPG$/i, '.jpg')
            .replace(/ /g, '%20');

        const imagePath = path.join(imageBasePath, normalizedImageName);
        questionText = questionText.replace(
            /<img src='[^']+'>\.?/,
            `\n\n![Question ${task.id} Image](${imagePath})\n\n`,
        );
    }

    // Handle HTML tags in question text
    questionText = questionText.replace(/<br>/gi, '\n\n');

    markdown += `${questionText}\n\n`;

    // Add task type
    const taskTypeNames = {
        [TaskType.SingleChoice]: 'Single Choice',
        [TaskType.MultipleChoice]: 'Multiple Choice',
        [TaskType.Ranking]: 'Ranking',
        [TaskType.MatchingColumns]: 'Matching Columns',
        [TaskType.MatchingPairs]: 'Matching Pairs',
        [TaskType.MatchingValues]: 'Matching Values',
        [TaskType.TextInput]: 'Text Input',
    };

    markdown += `*Type: ${taskTypeNames[task.options.type]} (${task.options.right} correct answer${task.options.right !== 1 ? 's' : ''})*\n\n`;

    // Add answers with highlighting for correct answers
    task.answers.forEach((answer) => {
        // first 'right' number of answers are correct
        const isCorrect = answer.idx <= task.options.right;

        let prefix = `${answer.idx}`;

        // If it's a matching values task and there's an image, use letters
        if (task.options.type === TaskType.MatchingValues && task.question.imgUrl) {
            // Convert index to letter (1->a, 2->b, etc.)
            prefix = String.fromCharCode(96 + answer.idx);
        }

        if (isCorrect) {
            markdown += `**✓ ${prefix}. ${answer.text}**\n\n`;
        } else {
            markdown += `   ${prefix}. ${answer.text}\n\n`;
        }
    });

    return markdown;
}

/**
 * Convert TestData to Markdown
 */
function testDataToMarkdown(
    testData: TestData,
    imageBasePath?: string,
): string {
    let markdown = `# ${testData.title}\n\n`;

    if (testData.author) {
        markdown += `*Author: ${testData.author}*\n\n`;
    }

    if (testData.date) {
        markdown += `*Date: ${testData.date}*\n\n`;
    }

    if (testData.copyright) {
        markdown += `*Copyright: ${testData.copyright}*\n\n`;
    }

    markdown += `Total questions: ${testData.tasks.length}\n\n`;
    markdown += `---\n\n`;

    // Convert each task to markdown
    testData.tasks.forEach((task) => {
        markdown += taskToMarkdown(task, imageBasePath);
        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Calculate the relative path from outputPath to imageBasePath
 */
function getRelativeImagePath(
    outputPath: string,
    imageBasePath: string,
): string {
    const outputDir = path.dirname(outputPath);
    return path.relative(outputDir, imageBasePath);
}

/**
 * Convert an FDB-parsed TXT file to Markdown
 */
export function convertTxtToMarkdown(
    inputPath: string,
    outputPath: string,
    imageBasePath?: string,
): void {
    try {
        const content = fs.readFileSync(inputPath, 'utf8');
        const testData = parseTxt(content);

        // correct image's path in markdown file
        const relativeImagePath = imageBasePath
            ? getRelativeImagePath(outputPath, imageBasePath)
            : undefined;

        // .{JPG|jpg} -> .jpg
        if (imageBasePath && fs.existsSync(imageBasePath)) {
            normalizeImageExtensions(imageBasePath);
        }

        const markdown = testDataToMarkdown(testData, relativeImagePath);
        fs.writeFileSync(outputPath, markdown);

        console.log(`Successfully converted ${inputPath} to ${outputPath}`);
    } catch (error) {
        console.error('Error converting TXT to Markdown:', error);
    }
}

/**
 * Main function for CLI usage
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node fdb-to-md.js input.txt output.md [imageBasePath]');
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const imageBasePath = args[2] || './';

    convertTxtToMarkdown(inputPath, outputPath, imageBasePath);
}

// If this file is run directly from Node.js
if (require.main === module) {
    main();
}
