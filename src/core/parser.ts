/**
 * Core parsing logic for .et1/.fdb files
 */

import path from 'path';
import iconv from 'iconv-lite';
import fs from 'fs/promises';
import { detectEncoding } from '../encoders/encoding-detector';
import { decodeText } from '../encoders/text-decoder';
import { calculatePoints } from '..';
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
    const questionRegex = /<(\d+)>\s*([\s\S]*?)\s*<\/\1>/g;
    let match: RegExpExecArray | null;

    while ((match = questionRegex.exec(bodyContent)) !== null) {
        const questionId = match[1];
        const questionContent = match[2];

        try {
            const question = parseQuestionContent(
                questionId,
                questionContent,
                warnings,
                debug,
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
    debug: boolean = false,
): Question | undefined {
    // Check if content is hex-encoded
    const isHexEncoded = /^[0-9A-Fa-f\s]+$/.test(content.trim());

    if (debug) {
        console.log(
            `Question ${id}: Content is ${isHexEncoded ? 'hex-encoded' : 'plain text'}`,
        );
    }

    // decode hex content if needed
    let decodedContent = content;
    if (isHexEncoded) {
        try {
            decodedContent = decodeHexContent(content, debug);
            if (debug) {
                console.log('Decoded hex content:');
                console.log(decodedContent.substring(0, 1600));
            }
        } catch (error) {
            warnings.push(
                `Failed to decode question ${id}: ${(error as Error).message}`,
            );
            return undefined;
        }
    }

    // get options from decoded content
    const optionsMatch = decodedContent.match(/<options>([\s\S]*?)<\/options>/);
    if (!optionsMatch) {
        if (debug) {
            console.log(`No options tag found in question ${id}`);
        }
        return undefined;
    }

    const optionsContent = optionsMatch[1];

    // parse options
    const nMatch = optionsContent.match(/n=(\d+)/);
    const typeMatch = optionsContent.match(/type=(\d+)/);
    const rightMatch = optionsContent.match(/right=(\d+)/);
    const maxMatch = optionsContent.match(/max=(\d+)/);

    if (!nMatch || !typeMatch || !rightMatch) {
        if (debug) {
            console.log(`Missing required options in question ${id}`);
        }
        return undefined;
    }

    const n = parseInt(nMatch[1]);
    const type = parseInt(typeMatch[1]) as QuestionType;
    const right = parseInt(rightMatch[1]);
    const max = maxMatch ? parseInt(maxMatch[1]) : 1;

    // get values (correct answers)
    const valueMatch = decodedContent.match(/<value>([\s\S]*?)<\/value>/);
    if (!valueMatch) {
        if (debug) {
            console.log(`No value tag found in question ${id}`);
        }
        return undefined;
    }

    const valueContent = valueMatch[1];
    const correctAnswers = valueContent
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => parseInt(line.trim()))
        .map((val, idx) => (val === 1 ? idx : -1))
        .filter((idx) => idx !== -1);

    // get question text
    const questionTextMatch = decodedContent.match(
        /<question>([\s\S]*?)<\/question>/,
    );
    if (!questionTextMatch) {
        if (debug) {
            console.log(`No question tag found in question ${id}`);
        }
        return undefined;
    }

    const questionText = decodeText(questionTextMatch[1].trim());

    // get title if available
    let title = '';
    const titleMatch = decodedContent.match(/<Q_TITLE>([\s\S]*?)<\/Q_TITLE>/);
    if (titleMatch) {
        title = titleMatch[1].trim();
    }

    // get description
    const descriptionMatch = decodedContent.match(
        /<description>([\s\S]*?)<\/description>/,
    );
    const description = descriptionMatch
        ? decodeText(descriptionMatch[1].trim())
        : '';

    // get answers
    const answers: { id: number; text: string }[] = [];
    for (let i = 1; i <= n; i++) {
        const answerRegex = new RegExp(
            `<a_${i}>\\s*([\\s\\S]*?)\\s*<\\/a_${i}>`,
            'i',
        );
        const answerMatch = decodedContent.match(answerRegex);

        if (answerMatch && answerMatch[1]) {
            answers.push({
                id: i - 1,
                text: answerMatch[1].trim(),
            });
        } else if (debug) {
            console.log(`Could not find answer ${i} in question ${id}`);
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
        points: calculatePoints(type, right), // Calculate points based on question type
        partialCredit: type === QuestionType.MultipleChoice && right > 1,
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
function decodeHexContent(hexContent: string, debug = false): string {
    try {
        // clean up whitespace and newlines
        const cleanHex = hexContent.replace(/\s+/g, '');
        const buffer = Buffer.from(cleanHex, 'hex');

        const possibleEncodings = [
            'win1251',
            'utf8',
            'utf16le',
            'udf16be',
            'cp866',
        ];

        let decodedContent = '';
        let usedEncoding = '';

        // auto-detect
        const detectedEncoding = detectEncoding(buffer);
        if (debug) {
            console.log(`Detected encoding: ${detectedEncoding}`);
        }

        // Try each encoding until one works
        for (const encoding of [detectedEncoding, ...possibleEncodings]) {
            try {
                const decoded = iconv.decode(buffer, encoding);

                // Quick validation
                if (decoded.includes('<') && decoded.includes('>')) {
                    decodedContent = decoded;
                    usedEncoding = encoding;
                    break;
                }
            } catch (e) {
                // Continue to next encoding
            }
        }

        if (!decodedContent) {
            // Fallback to win1251 if all else fails
            decodedContent = iconv.decode(buffer, 'win1251');
            usedEncoding = 'win1251 (fallback)';
        }

        if (debug) {
            console.log(`Used encoding: ${usedEncoding}`);
            console.log(`Decoded content (first 200 chars):`);
            console.log(decodedContent.substring(0, 200));
        }

        return decodedContent;
    } catch (error) {
        throw new Error(
            `Failed to decode hex content: ${(error as Error).message}`,
        );
    }
}
