/**
 * Core type definitions for the parser
 */

export enum QuestionType {
    SingleChoice = 1,
    MultipleChoice = 2,
    TextInput = 7,
    Matching = 6,
}

export interface Answer {
    id: number;
    text: string;
}

export interface Question {
    id: string;
    title?: string;
    type: QuestionType;
    text: string;
    description?: string;
    answers: Answer[];
    correctAnswers: number[]; // Indices of correct answers
    rightCount: number; // how many of correct answers needed
    maxAttempts: number; // for exam/prep modes
    points: number; // max points for the question
    partialCredit?: boolean; // are partial points awarded? (like 2.5/4)
}

export interface Category {
    title: string;
    questionIds: string[];
}

export interface TestData {
    title: string;
    questions: Question[];
    categories: Category[];
}

export interface ParserOptions {
    debug?: boolean;
    encoding?: string;
}

export interface ParserResult {
    data: TestData;
    warnings?: string[];
}
