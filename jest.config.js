module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/cli.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
};
