# DiffUse - AI-Powered Code Diff Explanation

DiffUse automatically generates human-readable explanations of code changes in pull requests using AI.

## Features

- 🔍 **Automatic Diff Analysis**: Analyzes Git diffs and generates plain-English explanations
- 🤖 **AI-Powered**: Uses OpenRouter's Mixtral model for intelligent code understanding
- 🔄 **GitHub Actions Integration**: Automatically comments on pull requests with explanations
- 📊 **Risk Assessment**: Evaluates the risk level of code changes
- 🎯 **Smart Filtering**: Focuses on meaningful code changes, ignoring metadata

## Setup

### 1. Get OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Create an API key
3. Add credits to your account (Mixtral model requires paid credits)

### 2. Configure Repository

1. Add your OpenRouter API key as a repository secret:
   - Go to Settings → Secrets and variables → Actions
   - Add a new secret named `OPENROUTER_API_KEY`
   - Paste your API key as the value

2. The GitHub Action will automatically trigger on pull requests

### 3. Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   
   *Note: If you see urllib3 SSL warnings, the requirements.txt pins urllib3 to version <2.0 to avoid compatibility issues.*

3. Create a `.env` file with your API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
4. Test the script:
   ```bash
   python scripts/explain_diff.py
   ```

## Usage

### GitHub Actions (Automatic)

The workflow automatically runs when:
- A pull request is opened
- New commits are pushed to a PR
- A PR is reopened

It will post a comment with the diff explanation.

### Manual Usage

```bash
# From a Git diff
git diff HEAD~1 | python scripts/explain_diff.py

# From a file
python scripts/explain_diff.py diff_file.txt

# Test with sample data
python scripts/explain_diff.py
```

## Scripts

- `explain_diff.py` - Main script for generating diff explanations
- `risk_score.py` - Evaluates risk level of changes
- `detect_conflict.py` - Detects potential merge conflicts
- `post_comment.py` - Posts comments to GitHub PRs

## API Limits

- OpenRouter uses a credit-based system
- Mixtral model costs approximately $0.0007 per 1K tokens
- Typical diff explanations use 100-500 tokens
- Monitor usage at [OpenRouter Dashboard](https://openrouter.ai/keys)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
