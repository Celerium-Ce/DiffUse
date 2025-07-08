# DiffUse VS Code Extension

🤖 **AI-powered Git diff analysis directly in VS Code**

DiffUse brings intelligent code change analysis to your editor, helping you understand what your changes do, assess their risk, and detect potential conflicts - all powered by AI.

## ✨ Features

- **📝 Explain Changes**: Get plain-English explanations of your code changes
- **⚠️ Risk Assessment**: Analyze the risk level of your modifications (1-10 scale)
- **🔍 Conflict Detection**: Identify potential merge conflicts before they happen
- **🤖 Full Analysis**: Complete analysis combining all three features
- **📊 Rich UI**: Beautiful webview panels with detailed results
- **🔧 Git Integration**: Works seamlessly with VS Code's Git features

## 🚀 Quick Start

### Installation

1. **Download the Extension**:
   - The extension is packaged as `diffuse-0.0.1.vsix`
   - Install it in VS Code: `Extensions → ... → Install from VSIX...`

2. **Open a Git Repository**:
   - Open VS Code in a folder with Git initialized
   - Or try our test project: `code /Users/mohammadhaaris/diffuse-test-project`

3. **Get an API Key**:
   - Visit [openrouter.ai](https://openrouter.ai) to get an API key
   - The extension will prompt you to enter it on first use

4. **Make Changes and Analyze**:
   - Edit some files in your Git repository
   - Use Command Palette (Cmd+Shift+P) and search for "DiffUse"
   - Try the commands: Explain, Assess Risk, Detect Conflicts

### 🧪 Test Project

We've created a ready-to-use test project at `/Users/mohammadhaaris/diffuse-test-project` with:
- ✅ Git repository initialized
- ✅ Initial commit with basic calculator app
- ✅ Uncommitted changes ready for analysis
- ✅ README with detailed testing instructions

**Open it now**: `code /Users/mohammadhaaris/diffuse-test-project`

## 🎯 Usage

### Commands Available

- `DiffUse: Explain Changes` - Understand what your code changes do
- `DiffUse: Assess Risk` - Get risk score and analysis
- `DiffUse: Detect Conflicts` - Check for potential merge issues
- `DiffUse: Full Analysis` - Complete analysis with all features
- `DiffUse: Settings` - Configure the extension

### How to Use

1. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "DiffUse"
2. **Source Control**: Look for DiffUse buttons in the Source Control panel
3. **Status Bar**: Click the DiffUse icon in the status bar for quick analysis

## ⚙️ Configuration

Open VS Code settings and search for "DiffUse":

- **OpenRouter API Key**: Your API key for AI analysis
- **Auto Analyze**: Automatically analyze changes on file save
- **Show Status Bar**: Display DiffUse icon in status bar

## 🔐 Security

- API keys are stored securely using VS Code's SecretStorage
- No code is stored or cached - everything is processed in real-time
- Works with private repositories
- All communication is encrypted

## 💡 Examples

### Explain Changes
```
📝 Added user authentication with email validation and password hashing
```

### Risk Assessment
```
⚠️ Risk Score: 6/10
📋 Reason: Modifies core authentication logic which could affect user login functionality
```

### Conflict Detection
```
🔍 Potential conflicts detected in user.service.ts - conflicting changes to login method
```

## 🛠️ Troubleshooting

### "Not a git repository" Error
If you see this error, make sure you:
1. **Open a Git repository** in VS Code (not just any folder)
2. **Have some changes** to analyze (modify files, add new files, etc.)
3. **Are in the root** of the Git repository

### Quick Setup for Testing
```bash
# Create a test Git repository
mkdir test-repo
cd test-repo
git init
echo "console.log('Hello World');" > test.js
git add .
git commit -m "Initial commit"

# Make some changes to test DiffUse
echo "console.log('Hello DiffUse!');" >> test.js
```

### No Changes to Analyze
If `git diff` returns empty, the extension will show "No changes to analyze". Make sure you have:
- Modified existing files
- Added new files (but not committed them)
- Staged changes you want to analyze

### API Key Issues
- Get your API key from [openrouter.ai](https://openrouter.ai)
- The extension will prompt you if no key is found
- Keys are stored securely in VS Code's SecretStorage

## 🛠️ Development

This extension is built with:
- TypeScript for type safety
- Webpack for bundling
- VS Code API for editor integration
- OpenRouter API for AI analysis

## 📋 Requirements

- VS Code 1.101.0 or higher
- **Git repository in workspace** (most important!)
- OpenRouter API key
- Internet connection for AI analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## � Common Issues & Troubleshooting

### ❌ "Not a git repository" Error

**Problem**: You see an error like "warning: Not a git repository" when trying to analyze changes.

**Solution**:
1. **Make sure you're in a Git repository**: The extension only works in folders that are initialized as Git repositories
2. **Initialize Git if needed**: Run `git init` in your project folder
3. **Open the correct folder**: Make sure VS Code is opened in the root of your Git repository
4. **Check your workspace**: The extension analyzes the currently open workspace folder

**Quick Fix**:
```bash
# Navigate to your project folder
cd /path/to/your/project

# Initialize Git if not already done
git init

# Make some changes to your files
echo "Hello World" > test.txt

# Stage and commit (optional, but recommended)
git add .
git commit -m "Initial commit"

# Make more changes to analyze
echo "Hello DiffUse!" > test.txt
```

### 🔑 API Key Issues

**Problem**: Extension asks for API key repeatedly or shows authentication errors.

**Solution**:
1. **Get a valid API key**: Visit [openrouter.ai](https://openrouter.ai) and create an account
2. **Enter the complete key**: Make sure to copy the entire API key without extra spaces
3. **Reset if needed**: Use `DiffUse: Settings` command to reconfigure your API key

### 🔍 No Changes Detected

**Problem**: Extension says "No changes detected" even though you've modified files.

**Solution**:
1. **Save your files**: Make sure all modified files are saved
2. **Check git status**: Run `git status` to see if Git detects your changes
3. **Stage changes**: You may need to stage files with `git add .`

### 🌐 Network/Connection Issues

**Problem**: Extension fails to connect to OpenRouter API.

**Solution**:
1. **Check internet connection**: Ensure you have a stable internet connection
2. **Verify API key**: Make sure your OpenRouter API key is valid and has credits
3. **Check firewall**: Ensure your firewall isn't blocking the connection

---

## 📋 Requirements

- VS Code 1.101.0 or higher
- **Git repository in workspace** (this is essential!)
- OpenRouter API key
- Internet connection for AI analysis

## 🔧 Extension Settings

This extension contributes the following settings:

- `diffuse.apiKey`: Your OpenRouter API key (stored securely)
- `diffuse.autoAnalyze`: Automatically analyze changes on file save (default: false)
- `diffuse.showStatusBar`: Display DiffUse icon in status bar (default: true)

## 📝 Release Notes

### 1.0.0

Initial release of DiffUse VS Code Extension:
- AI-powered Git diff explanation
- Risk assessment of code changes
- Conflict detection
- Webview panels for detailed analysis
- Secure API key storage

## 🐛 Issues & Support

Found a bug or need help? Please create an issue on our GitHub repository.

**Before reporting issues, please check:**
1. ✅ You're in a Git repository
2. ✅ You have a valid OpenRouter API key
3. ✅ You have internet connection
4. ✅ Your files are saved and Git detects changes

---

**Made with ❤️ for developers who want to understand their code changes better**
