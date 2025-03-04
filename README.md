# Net-Parser

## Overview

Net-Parser is a standalone command-line utility designed to parse proprietary
.et1/.fdb test files commonly used for computer networks certification tests and
exams and convert them into a standardized JSON format that can be easily used
in quiz-like learning platforms or exported into simple human-readable format.

## Features (wip)

- [ ] Parses .et1 file format
- [ ] Parses .fdb file format
- [ ] Automatically detects and handles different text encodings
- [ ] Extracts questions, answers, categories, and metadata
- [ ] Outputs clean, structured JSON
- [ ] Handles corrupted or partially readable files
- [ ] Command-line interface for easy integration

## Installation

Using bun:

```bash
# Install globally
bun install -g net-parser

# Or install locally in your project
bun install net-parser
```

## Usage

```bash
# Basic usage
net-parser convert path/to/file.fdb

# Specify output file
net-parser convert path/to/file.fdb -o output.json

# Validate only (no output)
net-parser validate path/to/file.fdb

# Show debug information
net-parser convert path/to/file.fdb --debug
```

## Programmatic Usage

```typescript
import { parseTestFile } from 'net-parser';

// Parse a file
const result = await parseTestFile('path/to/file.fdb');
console.log(result);

// Parse content directly
const content = await fs.readFile('path/to/file.fdb', 'utf-8');
const result = parseTestContent(content);
console.log(result);
```

## Architecture

```
net-parser/
├── src/
│   ├── core/           # Core parsing logic
│   ├── encoders/       # Encoding detection/conversion
│   ├── formatters/     # Output formatters
│   └── cli.ts          # Command-line interface
├── tests/              # Jest tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```
