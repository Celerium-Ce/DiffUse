# 🤖 DiffUse - AI-Powered Git Diff Analysis

> Transform your code changes into clear, understandable insights with AI

DiffUse automatically explains what your code changes do, assesses their risk, and detects potential conflicts - all powered by AI.

## ✨ What It Does

- **📝 Explains Changes**: "Added user authentication with logging"
- **⚠️ Risk Assessment**: "Score: 6/10 - Modifies authentication flow"  
- **🔍 Conflict Detection**: "Potential merge conflict in user.py"
- **🤖 GitHub Integration**: Automatically comments on your PRs

## 🚀 Quick Start

### 1. Get an API Key
```bash
# Sign up at https://openrouter.ai/
# Add some credits ($5 = ~1000 analyses)
# Copy your API key
```

### 2. Install DiffUse
```bash
git clone <this-repo>
cd diffuse-1
pip install -r requirements.txt

# Add your API key
echo "OPENROUTER_API_KEY=your_key_here" > .env
```

### 3. Make it Global (Optional)
```bash
# Add to your shell profile (~/.zshrc or ~/.bashrc)
export PATH="$PATH:/path/to/diffuse-1"

# Reload your shell
source ~/.zshrc
```

### 4. Test It
```bash
# Make some changes to your code, then:
diffuse

# You'll see something like:
# 🤖 DiffUse Analysis
# ==================
# 📝 What Changed:
#    Added user authentication with additional logging
# ⚠️ Risk Assessment:
#    Score: 4/10 - Low risk, adds logging functionality
```

## 🎯 Usage

### Basic Usage
```bash
diffuse                    # Analyze unstaged changes
diffuse --staged           # Analyze staged changes  
diffuse HEAD~1             # Compare with previous commit
diffuse main               # Compare with main branch
```

### Specific Analysis
```bash
diffuse --explain          # Just explain what changed
diffuse --risk             # Just show risk assessment
diffuse --detect           # Just detect conflicts
```

### Advanced Options
```bash
diffuse --json             # Output as JSON
diffuse --quiet            # Minimal output
diffuse --help             # Show all options
```

## 🔧 GitHub Actions (Auto PR Comments)

Add this to `.github/workflows/diffuse.yml`:

```yaml
name: DiffUse Analysis
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install DiffUse
      run: |
        pip install -r requirements.txt
        
    - name: Analyze Changes
      run: |
        git diff origin/${{ github.base_ref }} | python scripts/explain_diff.py
      env:
        OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

**Setup:**
1. Add `OPENROUTER_API_KEY` to your repo secrets
2. Push the workflow file
3. Open a PR and watch the magic! ✨

## 📊 Real Examples

### Code Change
```diff
- def login(username, password):
-     return authenticate(username, password)
+ def login(username, password):
+     logger.info(f"Login attempt for {username}")
+     result = authenticate(username, password)
+     if result:
+         logger.info(f"Successful login for {username}")
+     return result
```

### DiffUse Analysis
```
🤖 DiffUse Analysis
==================
📝 What Changed:
   Added comprehensive logging to track login attempts and successes

⚠️ Risk Assessment:
   Score: 3/10 - Low risk, improves observability without changing core logic

🔍 Potential Issues:
   No conflicts detected
```

## 🛠️ Troubleshooting

### "Missing API Key"
```bash
# Check if .env file exists
ls -la .env

# If not, create it:
echo "OPENROUTER_API_KEY=your_key_here" > .env
```

### "Command not found"
```bash
# Option 1: Use full path
/path/to/diffuse-1/diffuse

# Option 2: Add to PATH
export PATH="$PATH:/path/to/diffuse-1"
```

### "Not in git repository"
```bash
# Make sure you're in a git repo
git status

# If not, initialize one:
git init
```

## 💡 Pro Tips

1. **Use specific modes** for faster analysis:
   ```bash
   diffuse --explain    # Quick explanation only
   ```

2. **Check before committing**:
   ```bash
   git add .
   diffuse --staged     # Analyze what you're about to commit
   ```

3. **Compare branches**:
   ```bash
   diffuse develop      # See changes from develop branch
   ```

4. **JSON output** for tools:
   ```bash
   diffuse --json | jq '.explanation'
   ```

## 🏗️ Project Structure

```
diffuse-1/
├── diffuse                 # 🎯 Main CLI tool
├── scripts/
│   ├── explain_diff.py     # 📝 Change explanation
│   ├── risk_score.py       # ⚠️ Risk assessment  
│   ├── detect_conflict.py  # 🔍 Conflict detection
│   └── post_comment.py     # 💬 GitHub comments
├── .github/workflows/      # 🤖 GitHub Actions
├── requirements.txt        # 📦 Dependencies
└── .env                    # 🔐 Your API key
```

## 💰 Costs

- **OpenRouter**: ~$0.001 per analysis
- **$5 credit**: ~1000 analyses 
- **Typical usage**: $1-2/month for active development

## 🔒 Security

- ✅ API keys stored in `.env` (git-ignored)
- ✅ No code sent to third parties
- ✅ Uses OpenRouter's secure API
- ✅ Works with private repos

## 🤝 Contributing

Found a bug? Want a feature? 
1. Fork the repo
2. Make your changes  
3. Test with `diffuse --test`
4. Submit a PR

## 📄 License

MIT License - Use it, modify it, share it!
