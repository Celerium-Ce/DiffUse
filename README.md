# DiffUse - AI-Powered Code Diff Explanation

DiffUse automatically generates human-readable explanations of code changes in pull requests using AI.

## Features

- 🔍 **Automatic Diff Analysis**: Analyzes Git diffs and generates plain-English explanations
- 🤖 **AI-Powered**: Uses OpenRouter's Mixtral model for intelligent code understanding
- 🔄 **GitHub Actions Integration**: Automatically comments on pull requests with explanations
- 🌐 **Global CLI Tool**: Use `diffuse` command from any git repository
- 📊 **Risk Assessment**: Evaluates the risk level of code changes
- 🎯 **Smart Filtering**: Focuses on meaningful code changes, ignoring metadata
- 🔧 **Multiple Input Methods**: Supports stdin, file input, and direct git integration

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

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd diffuse-1
   ```

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

### 4. Global CLI Setup (Optional)

To use the `diffuse` command from any git repository:

1. Make the CLI script executable:
   ```bash
   chmod +x diffuse
   ```

2. Add the DiffUse directory to your PATH:
   ```bash
   # Add to your ~/.zshrc (or ~/.bashrc)
   export PATH="$PATH:/path/to/your/diffuse-1"
   ```

3. Reload your shell:
   ```bash
   source ~/.zshrc
   ```

4. Test the global command:
   ```bash
   diffuse --help
   ```

## Usage

### GitHub Actions (Automatic)

The workflow automatically runs when:
- A pull request is opened
- New commits are pushed to a PR
- A PR is reopened

It will post a comment with the diff explanation.

### Global CLI Usage

Once set up globally, you can use `diffuse` from any git repository:

```bash
# Explain unstaged changes
diffuse

# Explain staged changes
diffuse --staged

# Compare with a specific commit
diffuse HEAD~1

# Compare with a branch
diffuse main

# Compare between two commits
diffuse abc123 def456

# Show help
diffuse --help
```

### Direct Script Usage

```bash
# From a Git diff (pipe input)
git diff HEAD~1 | python scripts/explain_diff.py

# From a file
python scripts/explain_diff.py diff_file.txt

# Test with sample data
python scripts/explain_diff.py

# Using stdin
git diff | python scripts/explain_diff.py
```

### Advanced Usage Examples

```bash
# Explain changes in the last 3 commits
git diff HEAD~3 | python scripts/explain_diff.py

# Explain changes between branches
git diff main feature-branch | python scripts/explain_diff.py

# Save diff to file and explain
git diff > my_changes.diff
python scripts/explain_diff.py my_changes.diff
```

## Scripts

- `explain_diff.py` - Main script for generating diff explanations
- `risk_score.py` - Evaluates risk level of changes
- `detect_conflict.py` - Detects potential merge conflicts
- `post_comment.py` - Posts comments to GitHub PRs
- `diffuse` - Global CLI wrapper script for easy usage from any git repo

## File Structure

```
diffuse-1/
├── scripts/
│   ├── explain_diff.py     # Main diff explanation script
│   ├── risk_score.py       # Risk assessment
│   ├── detect_conflict.py  # Conflict detection
│   └── post_comment.py     # GitHub comment posting
├── .github/workflows/
│   └── diff-explainer.yml  # GitHub Actions workflow
├── diffuse                 # Global CLI wrapper
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (create this)
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **Missing API Key Error**
   ```
   RuntimeError: Missing OpenRouter API key in .env
   ```
   Solution: Create a `.env` file with your OpenRouter API key.

2. **SSL Warnings**
   ```
   urllib3 v2 only supports OpenSSL 1.1.1+
   ```
   Solution: The requirements.txt pins urllib3<2.0 to avoid this. If you still see warnings, they're suppressed in the code.

3. **Permission Denied (Global CLI)**
   ```
   bash: diffuse: Permission denied
   ```
   Solution: Run `chmod +x diffuse` to make the script executable.

4. **Command Not Found (Global CLI)**
   ```
   bash: diffuse: command not found
   ```
   Solution: Add the DiffUse directory to your PATH or use the full path.

### Testing Your Setup

1. Test the core script:
   ```bash
   python scripts/explain_diff.py
   ```

2. Test with real git diff:
   ```bash
   git diff HEAD~1 | python scripts/explain_diff.py
   ```

3. Test global CLI (if set up):
   ```bash
   diffuse --help
   ```

## API Limits

- OpenRouter uses a credit-based system
- Mixtral model costs approximately $0.0007 per 1K tokens
- Typical diff explanations use 100-500 tokens
- Monitor usage at [OpenRouter Dashboard](https://openrouter.ai/keys)

## Current Capabilities

✅ **Working Features:**
- Core diff explanation with AI
- GitHub Actions integration
- Global CLI tool (`diffuse` command)
- Multiple input methods (stdin, file, git)
- Branch and commit comparison
- SSL warning suppression
- Error handling and validation

🚧 **Potential Enhancements:**
- File-by-file analysis for large diffs
- Risk assessment integration
- Multiple output formats (JSON, Markdown)
- Interactive mode
- Configuration file support
- Caching for performance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**DiffUse** - Making code changes understandable, one diff at a time! 🚀
