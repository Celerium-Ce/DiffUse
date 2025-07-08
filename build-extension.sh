#!/usr/bin/env bash
# build-extension.sh
# Builds and packages the VS Code extension

set -e

echo "🔧 Building DiffUse VS Code Extension..."

# Check if we're in the right directory
if [ ! -d "vsexten" ]; then
    echo "❌ Error: Run this script from the root of the DiffUse repository"
    exit 1
fi

# Ensure we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository root"
    exit 1
fi

# Make sure the vsexten directory doesn't have its own git repo
if [ -d "vsexten/.git" ]; then
    echo "⚠️ Warning: vsexten has its own .git directory. Removing..."
    rm -rf vsexten/.git
fi

# Navigate to the extension directory
cd vsexten

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not found. Please install Node.js and npm."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the extension
echo "🏗️ Building extension..."
npm run vscode:prepublish

# Package the extension
echo "📦 Packaging extension..."
if command -v vsce &> /dev/null; then
    vsce package
else
    echo "🔍 vsce not found, installing..."
    npm install -g @vscode/vsce
    vsce package
fi

# Copy to root for easy access
echo "📋 Copying .vsix file to repository root..."
cp *.vsix ../

echo "✅ Build complete!"
echo "🚀 To install the extension in VS Code:"
echo "   1. Launch VS Code"
echo "   2. View → Extensions"
echo "   3. Click ... → Install from VSIX"
echo "   4. Select the .vsix file in the repository root"
