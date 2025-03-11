import { normalizeLineEndings } from '../encoders/text-decoder';
import { extractTagContent } from '../utils/tag-extractor';
import {
    Task,
    TaskType,
    TestData,
    Category,
    Answer,
    Question,
    TaskOptions,
    ParserOptions,
} from './types';

/**
 * Parse value from options string (e.g., "n=10" -> 10)
 */
function parseOptionValue(optionsText: string, key: string): number | null {
    const regex = new RegExp(`${key}=(\\d+)`, 'i');
    const match = regex.exec(optionsText);

    if (!match) return null;

    return parseInt(match[1], 10);
}

/**
 * Parse task options from options tag content
 */
function parseTaskOptions(optionsText: string): TaskOptions {
    return {
        n: parseOptionValue(optionsText, 'n') || 0,
        type:
            (parseOptionValue(optionsText, 'type') as TaskType) ||
            TaskType.SingleChoice,
        right: parseOptionValue(optionsText, 'right') || 0,
        max: parseOptionValue(optionsText, 'max') || 1,
    };
}

/**
 * Parse answers from task content
 */
function parseAnswers(taskContent: string, count: number): Answer[] {
    const answers: Answer[] = [];

    for (let i = 1; i <= count; i++) {
        const answerText = extractTagContent(taskContent, `a_${i}`);
        if (answerText) {
            answers.push({
                idx: i,
                text: answerText,
            });
        }
    }

    return answers;
}

/**
 * Parse a single task from text content
 */
function parseTask(taskContent: string, id: string): Task | null {
    // Check if the task is marked as deleted
    const titleText = extractTagContent(taskContent, 'Q_TITLE');
    const isDeleted = titleText?.trim() === 'Deleted!';

    // Parse options
    const optionsText = extractTagContent(taskContent, 'options');
    if (!optionsText) return null;

    const options = parseTaskOptions(optionsText);

    // Parse question
    const questionText = extractTagContent(taskContent, 'question');
    if (!questionText) return null;

    const questionObj: Question = {
        title: titleText || undefined,
        text: questionText,
    };

    // Check for image in question
    const imgMatch = questionText.match(/<img src='([^']+)'>/i);
    if (imgMatch) {
        questionObj.imgUrl = imgMatch[1].replace(/\\/g, '/');
    }

    // Parse description
    const descriptionText = extractTagContent(taskContent, 'description') || '';

    // Parse answers
    const answers = parseAnswers(taskContent, options.n);

    return {
        id,
        options,
        question: questionObj,
        description: {
            text: descriptionText,
        },
        answers,
        isDeleted,
    };
}

/**
 * Parse text file content into TestData object
 */
export function parseTxt(content: string, options?: ParserOptions): TestData {
    // Default options
    const opts: ParserOptions = {
        includeDeleted: false,
        ...options,
    };

    // Normalize line endings to ensure consistent parsing
    content = normalizeLineEndings(content);

    // Split content into individual Q_DATA sections
    const taskRegex = /<Q_DATA>[\s\S]*?<\/Q_DATA>/gi;
    const taskMatches = content.match(taskRegex) || [];

    const tasks: Task[] = [];
    const taskIds: string[] = [];

    // Parse each task
    taskMatches.forEach((taskText, index) => {
        const id = (index + 1).toString();
        const task = parseTask(taskText, id);

        if (task && (!task.isDeleted || opts.includeDeleted)) {
            tasks.push(task);
            taskIds.push(id);
        }
    });

    // Create a default category containing all non-deleted tasks
    const mainCategory: Category = {
        title: 'All Questions',
        taskIds,
        level: 0,
    };

    // Create TestData object
    const testData: TestData = {
        title: 'Parsed Test',
        tasks,
        categories: [mainCategory],
    };

    return testData;
}
