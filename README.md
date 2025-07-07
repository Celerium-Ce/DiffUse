# AI Code Review Assistant

This project provides an AI-powered code review assistant for GitHub pull requests. It automatically explains code changes, calculates risk scores, detects merge conflicts, and posts results as comments on PRs.

## Features
- **AI explanations** of code diffs
- **Risk scoring** for PRs
- **Merge conflict detection and explanation**
- **Automated PR comments**

## How it works
1. On every pull request, the GitHub Action runs the scripts in `scripts/`.
2. Each script performs its task (explaining diffs, scoring risk, etc.).
3. Results are posted as comments on the PR.

## Setup
- Add your OpenAI or HuggingFace API key as a GitHub secret if needed.
- See `requirements.txt` for dependencies.

## License
MIT (see LICENSE)
