# Net-Parser

## Overview

Net-Parser is a standalone command-line utility designed to parse proprietary
.et1/.fdb test files commonly used for computer networks certification tests and
exams and convert them into a standardized JSON format that can be easily used
in quiz-like learning platforms or exported into simple human-readable format.

## Features (wip)

- [ ] Decodes .et1 file format
- [x] Converts .fdb file format to .txt, .md, .pdf
- [ ] Converts to .json
- [ ] Does health checks for encodings in created .txt
- [ ] Automatically detects and handles different text encodings
- [ ] Extracts questions, answers
- [ ] Extracts categories, and metadata
- [ ] Handles corrupted or partially readable files
- [ ] Command-line interface for easy integration

## Installation

(COMING SOON) Using bun:

```bash
# Install globally
bun install -g net-parser

# Or install locally in your project
bun install net-parser
```

## Usage

CURRENT USAGE:

```
# 1. Convert FDB to TXT
node dist/converters/fdb-to-txt.js exam.fdb exam.txt

# Convert TXT directly to PDF
node dist/converters/txt-to-pdf.js input.txt output.pdf [imageBasePath] [cssPath] [--keep-markdown]

# Use --keep-markdown to preserve the intermediate Markdown file
```


> [!WARNING]
> COMING SOON

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

