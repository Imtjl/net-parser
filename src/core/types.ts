/**
 * Core type definitions for the .fdb parser
 */

/*--------------| Test structure |--------------*/

/**
 * Complete test data structure
 */
export interface TestData {
	title: string; // Test title from <T_title> or info-id
	author?: string; // Author info from info-id
	copyright?: string; // Copyright info from info-id
	date?: string; // Date info from info-id
	tasks: Task[]; // All tasks in the test
	categories: Category[]; // Hierarchical category structure
	groups?: Group[]; // Optional group information from gr-id
}

/**
 * Represents a category or subcategory in the test structure
 */
export interface Category {
	title: string; // Category name
	taskIds: string[]; // IDs of tasks in this category
	subcategories?: Category[]; // Optional subcategories
	level: number; // Indentation level (0 for main, 1 for sub, etc.)
}

/**
 * Group structure found in gr-id data
 */
export interface Group {
	id: string; // Group ID (e.g., "0", "1")
	taskIds: {
		tv_i: string[]; // IDs from tv_i tag
		tv_p: string[]; // IDs from tv_p tag
		tv_d: string[]; // IDs from tv_d tag
	};
}

/*--------------| Tasks |--------------*/

/**
 * Represents a task
 * - mainly comes from <T_body> tag
 * - have some additional fields for correct json and mapping ids
 */
export interface Task {
	id: string; // question ID as used in the test (<n>)
	options: TaskOptions; // from <options> tag
	question: Question;
	description: Description; // useless probably
	answers: Answer[];
	maxAttempts?: number; // for exam/prep modes
	isDeleted?: boolean; // True if question title contains "Deleted!" - used for filtering
}

/**
 * Represents <options> tag
 */
export interface TaskOptions {
	n: number; // amount of possible answers
	type: TaskType;
	right: number; // amount of correct answers
	max: number; // question cost (1-3)
}

/**
 * Enum for task types
 */
export enum TaskType {
	SingleChoice = 1, // "Простой выбор"
	MultipleChoice = 2, // "Множественный выбор"
	Ranking = 3, // "Ранжировка"
	MatchingColumns = 4, // "Простой выбор (2 столбца)"
	MatchingPairs = 5, // "Пары соответствий"
	MatchingValues = 6, // "Пары соответствий (значения)"
	TextInput = 7, // "Ответ открытой формы"
}

/**
 * Represents <question> tag
 */
export interface Question {
	title?: string; // Title from Q_TITLE, may be empty or "Deleted!"
	text: string;
	imgUrl?: string;
}

/**
 * Represents <description> tag
 */
export interface Description {
	text: string;
}

/**
 * Represents <a_n> tags
 */
export interface Answer {
	idx: number; // <a_1>, <a_2>, <a_3> and so on
	text: string;
}

/*--------------| Parser |--------------*/

export interface ParserOptions {
	debug?: boolean; // Enable debug output
	encoding?: string; // Character encoding to use (default: win1251)
	includeDeleted?: boolean; // Whether to include deleted questions
}

/**
 * Final parser result
 */
export interface ParserResult {
	data: TestData; // The parsed test data
	warnings?: string[]; // Any warnings encountered during parsing
	raw?: {
		decodedTags?: Record<string, string>; // All decoded tags
	};
}

/*--------------| Util |--------------*/

/**
 * Intermediate parsed question data before processing
 */
export interface RawQuestionData {
	id: string;
	hexContent: string;
	decodedContent?: string;
}

/**
 * Raw tag content extracted during parsing
 */
export interface TagContent {
	tag: string; // Tag name
	content: string; // Raw content between tags
}
