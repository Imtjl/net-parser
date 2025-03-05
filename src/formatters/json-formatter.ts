/**
 * JSON formatter for test data
 */

import { TestData } from '../core/types';

/**
 * Format test data as JSON
 *
 * @param data The test data to format
 * @param pretty Whether to format the JSON with indentation
 * @returns The formatted JSON string
 */
export function formatAsJson(data: TestData, pretty: boolean = true): string {
    // Apply any normalization or cleanup before formatting
    const cleanedData = cleanupTestData(data);

    // Convert to JSON string
    return pretty
        ? JSON.stringify(cleanedData, null, 2)
        : JSON.stringify(cleanedData);
}

/**
 * Clean up test data before formatting
 * This ensures consistent output format and removes any problematic data
 */
function cleanupTestData(data: TestData): TestData {
    // Make a deep copy to avoid modifying the original
    const cleanedData: TestData = JSON.parse(JSON.stringify(data));

    // Clean up questions
    cleanedData.questions = cleanedData.questions.map((question) => {
        // Ensure question text is trimmed
        question.text = question.text.trim();

        // Remove empty description
        if (!question.description || question.description.trim() === '') {
            delete question.description;
        } else {
            question.description = question.description.trim();
        }

        // Remove empty title
        if (!question.title || question.title.trim() === '') {
            delete question.title;
        } else {
            question.title = question.title.trim();
        }

        // Clean up answers
        question.answers = question.answers.map((answer) => {
            return {
                id: answer.id,
                text: answer.text.trim(),
            };
        });

        return question;
    });

    // Clean up categories
    cleanedData.categories = cleanedData.categories.map((category) => {
        return {
            title: category.title.trim(),
            questionIds: category.questionIds,
        };
    });

    // Ensure title is defined
    cleanedData.title = cleanedData.title || 'Untitled Test';

    return cleanedData;
}

/**
 * Validate test data structure
 *
 * @param data The test data to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateTestData(data: TestData): string[] {
    const errors: string[] = [];

    // Check title
    if (!data.title) {
        errors.push('Missing test title');
    }

    // Check questions
    if (!data.questions || !Array.isArray(data.questions)) {
        errors.push('Missing or invalid questions array');
    } else {
        // Check each question
        data.questions.forEach((question, index) => {
            if (!question.id) {
                errors.push(`Question at index ${index} is missing an id`);
            }

            if (!question.text) {
                errors.push(`Question ${question.id || index} is missing text`);
            }

            if (!question.type) {
                errors.push(`Question ${question.id || index} is missing a type`);
            }

            if (!question.answers || !Array.isArray(question.answers)) {
                errors.push(
                    `Question ${question.id || index} is missing answers array`,
                );
            } else if (question.answers.length === 0) {
                errors.push(
                    `Question ${question.id || index} has an empty answers array`,
                );
            }

            if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
                errors.push(
                    `Question ${question.id || index} is missing correctAnswers array`,
                );
            }
        });
    }

    // Check categories
    if (!data.categories || !Array.isArray(data.categories)) {
        errors.push('Missing or invalid categories array');
    } else {
        // Check each category
        data.categories.forEach((category, index) => {
            if (!category.title) {
                errors.push(`Category at index ${index} is missing a title`);
            }

            if (!category.questionIds || !Array.isArray(category.questionIds)) {
                errors.push(
                    `Category ${category.title || index} is missing questionIds array`,
                );
            }
        });
    }

    return errors;
}
