import { QuestionType } from ".";

/**
 * Calculate default points for a question based on its type and complexity
 */
export function calculatePoints(type: QuestionType, rightCount: number): number {
    switch (type) {
        case QuestionType.SingleChoice:
            return 1;
        case QuestionType.MultipleChoice:
            return Math.max(rightCount, 1); // Multiple choice is worth at least 1 point, up to rightCount
        case QuestionType.TextInput:
            return 2; // Text input is typically worth more
        case QuestionType.Matching:
            return rightCount; // Matching is worth 1 point per correct match
        default:
            return 1;
    }
}
