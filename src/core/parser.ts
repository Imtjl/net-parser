/**
 * Core parsing logic for .et1/.fdb files
 */

import path from 'path';
import fs from 'fs/promises';
import { detectEncoding } from '../encoders/encoding-detector';
import { decodeText } from '../encoders/text-decoder';
import {
    ParserOptions,
    ParserResult,
    TestData,
    Question,
    Category,
    QuestionType,
} from './types';

/**
 * Parse a test file from the given file path
 *
 * @param filePath Path to the .et1 or .fdb file
 * @param options Parser options
 * @returns Parsed test data
 */
export async function parseTestFile(
    filePath: string,
    options: ParserOptions = {},
): Promise<ParserResult> {
    try {
        const fileContent = await fs.readFile(filePath);
        const encoding = options.encoding || detectEncoding(fileContent);
        const content = decodeText(fileContent, encoding);

        return parseTestContent(content, options);
    } catch (error) {
        throw new Error(`Failed to parse test file: ${(error as Error).message}`);
    }
}

/**
 * Parse test content directly from a string
 *
 * @param content The test content as a string
 * @param options Parser options
 * @returns Parsed test data
 */
export function parseTestContent(
    content: string,
    options: ParserOptions = {},
): ParserResult {
    const warnings: string[] = [];
    const debug = options.debug || false;

    if (debug) {
        console.log(`Parsing test content (${content.length} bytes)`);
    }

    try {
        // Extract test sections
        const headMatch = content.match(/<T_head>([\s\S]*?)<\/T_head>/);
        const bodyMatch = content.match(/<T_body>([\s\S]*?)<\/T_body>/);
        const tviMatch = content.match(/<tv_i>([\s\S]*?)<\/tv_i>/);
        const infoMatch = content.match(/<info-id>([\s\S]*?)<\/info-id>/);

        if (!bodyMatch) {
            throw new Error('Invalid test file: no T_body section found');
        }

        // Parse metadata
        let title = '';
        if (infoMatch) {
            const nameMatch = infoMatch[1].match(/Íàçâàíèå=([\s\S]*?)(?:\r?\n|$)/);
            if (nameMatch) {
                title = nameMatch[1].trim();
            }
        }

        // Parse questions
        const bodyContent = bodyMatch[1];
        const questions = parseQuestions(bodyContent, warnings, debug);

        // Parse categories
        const categories = tviMatch
            ? parseCategories(tviMatch[1], warnings, debug)
            : [];

        const testData: TestData = {
            title: title || 'Untitled Test',
            questions,
            categories,
        };

        return {
            data: testData,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    } catch (error) {
        throw new Error(
            `Failed to parse test content: ${(error as Error).message}`,
        );
    }
}

/**
 * Parse questions from the body section
 */
function parseQuestions(
    bodyContent: string,
    warnings: string[],
    debug: boolean,
): Question[] {
    const questions: Question[] = [];
    const questionRegex = /<(\d+)>([\s\S]*?)<\/\1>/g;
    let match;

    while ((match = questionRegex.exec(bodyContent)) !== null) {
        const questionId = match[1];
        const questionContent = match[2];

        try {
            const question = parseQuestionContent(
                questionId,
                questionContent,
                warnings,
            );
            if (question) {
                questions.push(question);
            }
        } catch (error) {
            const errorMessage = `Error parsing question ${questionId}: ${(error as Error).message}`;
            warnings.push(errorMessage);
            if (debug) {
                console.error(errorMessage);
            }
        }
    }

    return questions;
}

/**
 * Parse an individual question
 */
function parseQuestionContent(
    id: string,
    content: string,
    warnings: string[],
): Question | null {
    // Check if content is hex-encoded
    const isHexEncoded = /^[0-9A-Fa-f\s]+$/.test(content.trim());

    // Decode hex content if needed
    let decodedContent = content;
    if (isHexEncoded) {
        try {
            decodedContent = decodeHexContent(content);
        } catch (error) {
            warnings.push(
                `Failed to decode question ${id}: ${(error as Error).message}`,
            );
            return null;
        }
    }

    // Extract options from decoded content
    const optionsMatch = content.match(/<options>([\s\S]*?)<\/options>/);
    if (!optionsMatch) return null;

    const optionsContent = optionsMatch[1];

    // Parse options
    const nMatch = optionsContent.match(/n=(\d+)/);
    const typeMatch = optionsContent.match(/type=(\d+)/);
    const rightMatch = optionsContent.match(/right=(\d+)/);
    const maxMatch = optionsContent.match(/max=(\d+)/);

    if (!nMatch || !typeMatch || !rightMatch) return null;

    const n = parseInt(nMatch[1]);
    const type = parseInt(typeMatch[1]) as QuestionType;
    const right = parseInt(rightMatch[1]);
    const max = maxMatch ? parseInt(maxMatch[1]) : 1;

    // Extract values (correct answers)
    const valueMatch = content.match(/<value>([\s\S]*?)<\/value>/);
    if (!valueMatch) return null;

    const valueContent = valueMatch[1];
    const correctAnswers = valueContent
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => parseInt(line.trim()))
        .map((val, idx) => (val === 1 ? idx : -1))
        .filter((idx) => idx !== -1);

    // Extract question text
    const questionTextMatch = content.match(/<question>([\s\S]*?)<\/question>/);
    if (!questionTextMatch) return null;

    const questionText = decodeText(questionTextMatch[1].trim());

    // Extract title if available
    let title = '';
    const titleMatch = content.match(/<Q_TITLE>([\s\S]*?)<\/Q_TITLE>/);
    if (titleMatch) {
        title = titleMatch[1].trim();
    }

    // Extract description
    const descriptionMatch = content.match(
        /<description>([\s\S]*?)<\/description>/,
    );
    const description = descriptionMatch
        ? decodeText(descriptionMatch[1].trim())
        : '';

    // Extract answers
    const answers: { id: number; text: string }[] = [];
    for (let i = 1; i <= n; i++) {
        const answerMatch = content.match(
            new RegExp(`<a_${i}>([\s\S]*?)<\/a_${i}>`),
        );
        if (answerMatch) {
            answers.push({
                id: i - 1,
                text: decodeText(answerMatch[1].trim()),
            });
        }
    }

    return {
        id,
        title,
        type,
        text: questionText,
        description,
        answers,
        correctAnswers,
        rightCount: right,
        maxAttempts: max,
    };
}

/**
 * Parse categories from the tv_i section
 */
function parseCategories(
    tviContent: string,
    warnings: string[],
    debug: boolean,
): Category[] {
    const categories: Category[] = [];
    let currentCategory: Category | null = null;

    // Parse categories and subcategories
    const lines = tviContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l);

    for (const line of lines) {
        // Check if line is indented (subcategory)
        if (line.startsWith('\t')) {
            // This is a subcategory or question ID
            if (!currentCategory) continue;

            // Check if it's a question ID (numeric) or a subcategory
            const trimmedLine = line.trim();
            if (/^\d+$/.test(trimmedLine) || /^\d+_\d+$/.test(trimmedLine)) {
                // It's a question ID
                currentCategory.questionIds.push(trimmedLine);
            } else {
                // It's a subcategory name, create a new subcategory
                currentCategory = {
                    title: decodeText(trimmedLine),
                    questionIds: [],
                };
                categories.push(currentCategory);
            }
        } else {
            // This is a main category, create a new one
            currentCategory = {
                title: decodeText(line),
                questionIds: [],
            };
            categories.push(currentCategory);
        }
    }

    return categories;
}

/**
 * Decode hexadecimal encoded content
 */
function decodeHexContent(hexContent: string): string {
    try {
        // Clean up whitespace and newlines
        const cleanHex = hexContent.replace(/\s+/g, '');
        // Convert hex to binary buffer
        const buffer = Buffer.from(cleanHex, 'hex');
        // Convert buffer to string using appropriate encoding
        // note: the encoding for binary probably isn't affected by anything, so it's likely a utf-8
        return buffer.toString('utf8');
    } catch (error) {
        throw new Error(
            `Failed to decode hex content: ${(error as Error).message}`,
        );
    }
}
