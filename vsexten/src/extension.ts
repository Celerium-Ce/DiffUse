import * as vscode from 'vscode';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DiffAnalysis {
    explanation?: string;
    risk?: {
        score: number;
        reason: string;
    };
    conflicts?: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

class DiffUseProvider {
    private statusBarItem: vscode.StatusBarItem;
    private outputChannel: vscode.OutputChannel;
    private currentPanel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.outputChannel = vscode.window.createOutputChannel('DiffUse');
        this.setupStatusBar();
    }

    private setupStatusBar() {
        this.statusBarItem.command = 'diffuse.fullAnalysis';
        this.statusBarItem.text = '$(search) DiffUse';
        this.statusBarItem.tooltip = 'Click to analyze Git changes';
        
        const config = vscode.workspace.getConfiguration('diffuse');
        if (config.get('showStatusBar', true)) {
            this.statusBarItem.show();
        }
    }

    private async getApiKey(): Promise<string> {
        console.log('🔑 Getting API key...');
        
        // Check all possible sources for the API key
        
        // 1. Try from secrets (most secure)
        const secretKey = await this.context.secrets.get('diffuse.openrouterApiKey');
        if (secretKey) {
            console.log('🔒 API key found in secrets');
            return secretKey;
        }
        
        // 2. Try from extension settings
        const config = vscode.workspace.getConfiguration('diffuse');
        const configKey = config.get<string>('openrouterApiKey');
        if (configKey) {
            console.log('⚙️ API key found in settings');
            return configKey;
        }
        
        // 3. Try from .env file in workspace
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const rootPath = workspaceFolders[0].uri.fsPath;
                const { stdout } = await execAsync(`grep OPENROUTER_API_KEY "${rootPath}/.env" 2>/dev/null || echo ""`);
                if (stdout) {
                    const envMatch = stdout.match(/OPENROUTER_API_KEY=(.+)/);
                    if (envMatch && envMatch[1]) {
                        console.log('📄 API key found in .env file');
                        return envMatch[1].trim();
                    }
                }
            }
        } catch (error) {
            // Silently fail if .env doesn't exist or can't be read
        }
        
        // 4. Prompt user for API key if not found anywhere
        console.log('💬 Prompting user for API key...');
        const input = await vscode.window.showInputBox({
            prompt: 'Enter your OpenRouter API key (get one at openrouter.ai)',
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'sk-or-v1-...'
        });
        
        if (input) {
            console.log('✅ User provided API key, storing in secrets...');
            await this.context.secrets.store('diffuse.openrouterApiKey', input);
            return input;
        }
        
        // If we get here, we have no API key
        console.log('❌ User cancelled API key input');
        throw new Error('API key required to use DiffUse');
    }
        }
        
        console.log('🎉 API key ready!');
        return apiKey;
    }

    private async getGitDiff(staged: boolean = false): Promise<string> {
        console.log('📁 Getting workspace folder...');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.log('❌ No workspace folder found');
            throw new Error('No workspace folder found. Please open a folder with Git repository.');
        }
        
        console.log('📂 Workspace:', workspaceFolder.uri.fsPath);
        
        const command = staged ? 'git diff --staged' : 'git diff';
        console.log('🔄 Running command:', command);
        
        try {
            const { stdout, stderr } = await execAsync(command, { cwd: workspaceFolder.uri.fsPath });
            
            if (stderr) {
                console.log('⚠️ Git stderr:', stderr);
            }
            
            if (!stdout.trim()) {
                console.log('📝 No changes detected');
                throw new Error('No changes detected. Make some changes to your files first.');
            }
            
            console.log('✅ Git diff retrieved, length:', stdout.length);
            return stdout;
        } catch (error: any) {
            console.log('❌ Git command failed:', error.message);
            throw new Error(`Git command failed: ${error.message}. Make sure you're in a Git repository.`);
        }
    }

    private async callOpenRouterAPI(prompt: string, diffText: string): Promise<string> {
        const apiKey = await this.getApiKey();
        
        const response = await axios.post<OpenRouterResponse>('https://openrouter.ai/api/v1/chat/completions', {
            model: 'mistralai/mixtral-8x7b-instruct',
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\nCode diff:\n${diffText}`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    async explainChanges(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Explaining changes...',
                cancellable: false
            }, async () => {
                const diff = await this.getGitDiff();
                const prompt = 'You are an expert code reviewer. In one clear, human sentence, explain the main purpose of this code change for a pull request summary. Focus on what functionality or behavior is being added, removed, or changed. Avoid repeating code.';
                
                const explanation = await this.callOpenRouterAPI(prompt, diff);
                
                this.outputChannel.appendLine(`📝 Explanation: ${explanation}`);
                this.outputChannel.show();
                
                vscode.window.showInformationMessage(`📝 ${explanation}`, 'View Details').then(selection => {
                    if (selection === 'View Details') {
                        this.showAnalysisPanel({ explanation });
                    }
                });
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async assessRisk(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Assessing risk...',
                cancellable: false
            }, async () => {
                const diff = await this.getGitDiff();
                const prompt = 'You are a code reviewer bot. Analyze the following Git diff and do two things:\n1. Estimate the risk score (from 1 to 10) of this change.\n2. Explain the reasoning briefly.\n\nReturn your answer in the following format:\nRisk Score: <number>\nReason: <brief explanation>';
                
                const response = await this.callOpenRouterAPI(prompt, diff);
                
                // Parse the response to extract risk score and reason
                const riskMatch = response.match(/Risk Score:\s*(\d+)/);
                const reasonMatch = response.match(/Reason:\s*(.+)/s);
                
                const risk = {
                    score: riskMatch ? parseInt(riskMatch[1]) : 0,
                    reason: reasonMatch ? reasonMatch[1].trim() : response
                };
                
                this.outputChannel.appendLine(`⚠️ Risk Score: ${risk.score}/10`);
                this.outputChannel.appendLine(`📋 Reason: ${risk.reason}`);
                this.outputChannel.show();
                
                const riskLevel = risk.score >= 7 ? 'High' : risk.score >= 4 ? 'Medium' : 'Low';
                const icon = risk.score >= 7 ? '🔴' : risk.score >= 4 ? '🟡' : '🟢';
                
                vscode.window.showWarningMessage(`${icon} Risk: ${riskLevel} (${risk.score}/10)`, 'View Details').then(selection => {
                    if (selection === 'View Details') {
                        this.showAnalysisPanel({ risk });
                    }
                });
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async detectConflicts(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Detecting conflicts...',
                cancellable: false
            }, async () => {
                const diff = await this.getGitDiff();
                const prompt = 'You are a merge conflict detection expert. Analyze this Git diff and identify potential merge conflicts or issues that might arise when merging this code. Focus on:\n1. Conflicting changes to the same lines\n2. Dependencies that might be affected\n3. Breaking changes\n4. Integration issues\n\nIf no conflicts are detected, simply say "No conflicts detected."';
                
                const conflicts = await this.callOpenRouterAPI(prompt, diff);
                
                this.outputChannel.appendLine(`🔍 Conflict Detection: ${conflicts}`);
                this.outputChannel.show();
                
                const hasConflicts = !conflicts.toLowerCase().includes('no conflicts');
                const icon = hasConflicts ? '⚠️' : '✅';
                
                vscode.window.showInformationMessage(`${icon} ${conflicts}`, 'View Details').then(selection => {
                    if (selection === 'View Details') {
                        this.showAnalysisPanel({ conflicts });
                    }
                });
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async fullAnalysis(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Running full analysis...',
                cancellable: false
            }, async (progress) => {
                const diff = await this.getGitDiff();
                const analysis: DiffAnalysis = {};
                
                // Explanation
                progress.report({ increment: 25, message: 'Explaining changes...' });
                const explanationPrompt = 'You are an expert code reviewer. In one clear, human sentence, explain the main purpose of this code change for a pull request summary. Focus on what functionality or behavior is being added, removed, or changed. Avoid repeating code.';
                analysis.explanation = await this.callOpenRouterAPI(explanationPrompt, diff);
                
                // Risk Assessment
                progress.report({ increment: 25, message: 'Assessing risk...' });
                const riskPrompt = 'You are a code reviewer bot. Analyze the following Git diff and do two things:\n1. Estimate the risk score (from 1 to 10) of this change.\n2. Explain the reasoning briefly.\n\nReturn your answer in the following format:\nRisk Score: <number>\nReason: <brief explanation>';
                const riskResponse = await this.callOpenRouterAPI(riskPrompt, diff);
                
                const riskMatch = riskResponse.match(/Risk Score:\s*(\d+)/);
                const reasonMatch = riskResponse.match(/Reason:\s*(.+)/s);
                
                analysis.risk = {
                    score: riskMatch ? parseInt(riskMatch[1]) : 0,
                    reason: reasonMatch ? reasonMatch[1].trim() : riskResponse
                };
                
                // Conflict Detection
                progress.report({ increment: 25, message: 'Detecting conflicts...' });
                const conflictPrompt = 'You are a merge conflict detection expert. Analyze this Git diff and identify potential merge conflicts or issues that might arise when merging this code. Focus on:\n1. Conflicting changes to the same lines\n2. Dependencies that might be affected\n3. Breaking changes\n4. Integration issues\n\nIf no conflicts are detected, simply say "No conflicts detected."';
                analysis.conflicts = await this.callOpenRouterAPI(conflictPrompt, diff);
                
                progress.report({ increment: 25, message: 'Generating report...' });
                
                this.outputChannel.appendLine('🤖 DiffUse Full Analysis');
                this.outputChannel.appendLine('=' .repeat(40));
                this.outputChannel.appendLine(`📝 Explanation: ${analysis.explanation}`);
                this.outputChannel.appendLine(`⚠️ Risk Score: ${analysis.risk.score}/10`);
                this.outputChannel.appendLine(`📋 Risk Reason: ${analysis.risk.reason}`);
                this.outputChannel.appendLine(`🔍 Conflicts: ${analysis.conflicts}`);
                this.outputChannel.show();
                
                this.showAnalysisPanel(analysis);
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    private showAnalysisPanel(analysis: DiffAnalysis) {
        if (this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            this.currentPanel = vscode.window.createWebviewPanel(
                'diffuseAnalysis',
                'DiffUse Analysis',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            this.currentPanel.onDidDispose(() => {
                this.currentPanel = undefined;
            });
        }
        
        this.currentPanel.webview.html = this.getWebviewContent(analysis);
    }

    private getWebviewContent(analysis: DiffAnalysis): string {
        const riskColor = analysis.risk && analysis.risk.score >= 7 ? '#ff4444' : 
                         analysis.risk && analysis.risk.score >= 4 ? '#ffaa00' : '#44ff44';
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DiffUse Analysis</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    border-left: 4px solid var(--vscode-accent-color);
                    background-color: var(--vscode-editor-inactiveSelection-background);
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: var(--vscode-accent-color);
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .risk-score {
                    background-color: ${riskColor};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                }
                .content {
                    margin-top: 10px;
                }
                .icon {
                    font-size: 20px;
                }
            </style>
        </head>
        <body>
            <div class="title">🤖 DiffUse Analysis Results</div>
            
            ${analysis.explanation ? `
            <div class="section">
                <div class="section-title">
                    <span class="icon">📝</span>
                    <span>What Changed</span>
                </div>
                <div class="content">${analysis.explanation}</div>
            </div>
            ` : ''}
            
            ${analysis.risk ? `
            <div class="section">
                <div class="section-title">
                    <span class="icon">⚠️</span>
                    <span>Risk Assessment</span>
                    <span class="risk-score">${analysis.risk.score}/10</span>
                </div>
                <div class="content">${analysis.risk.reason}</div>
            </div>
            ` : ''}
            
            ${analysis.conflicts ? `
            <div class="section">
                <div class="section-title">
                    <span class="icon">🔍</span>
                    <span>Conflict Detection</span>
                </div>
                <div class="content">${analysis.conflicts}</div>
            </div>
            ` : ''}
            
            <div class="section">
                <div class="section-title">
                    <span class="icon">💡</span>
                    <span>Powered by DiffUse</span>
                </div>
                <div class="content">
                    This analysis was generated using AI to help you understand your code changes better.
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async openSettings(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'diffuse');
    }

    private handleError(error: any) {
        const message = error.message || 'An error occurred';
        this.outputChannel.appendLine(`❌ Error: ${message}`);
        this.outputChannel.show();
        
        if (message.includes('API key')) {
            vscode.window.showErrorMessage('DiffUse: API key required. Please configure your OpenRouter API key.', 'Open Settings').then(selection => {
                if (selection === 'Open Settings') {
                    this.openSettings();
                }
            });
        } else if (message.includes('Git repository') || message.includes('not a git repository')) {
            const helpMessage = 'DiffUse works only in Git repositories. Please:\n1. Open a Git repository in VS Code\n2. Or run "git init" in your project folder\n3. Make sure you have changes to analyze';
            vscode.window.showErrorMessage(helpMessage, 'Learn More', 'Initialize Git').then(selection => {
                if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository'));
                } else if (selection === 'Initialize Git') {
                    vscode.commands.executeCommand('git.init');
                }
            });
        } else if (message.includes('No changes detected')) {
            vscode.window.showInformationMessage('No changes detected. Make some changes to your files first, then try again.', 'Got it');
        } else {
            vscode.window.showErrorMessage(`DiffUse: ${message}`);
        }
    }

    dispose() {
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
        this.currentPanel?.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 DiffUse extension is now active!');
    
    const diffUseProvider = new DiffUseProvider(context);
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('diffuse.explainChanges', () => {
            console.log('📝 Explain Changes command triggered');
            return diffUseProvider.explainChanges();
        }),
        vscode.commands.registerCommand('diffuse.assessRisk', () => {
            console.log('⚠️ Assess Risk command triggered');
            return diffUseProvider.assessRisk();
        }),
        vscode.commands.registerCommand('diffuse.detectConflicts', () => {
            console.log('🔍 Detect Conflicts command triggered');
            return diffUseProvider.detectConflicts();
        }),
        vscode.commands.registerCommand('diffuse.fullAnalysis', () => {
            console.log('🤖 Full Analysis command triggered');
            return diffUseProvider.fullAnalysis();
        }),
        vscode.commands.registerCommand('diffuse.openSettings', () => {
            console.log('⚙️ Settings command triggered');
            return diffUseProvider.openSettings();
        })
    );

    // Register provider for cleanup
    context.subscriptions.push(diffUseProvider);
    
    // Show welcome message
    vscode.window.showInformationMessage('🤖 DiffUse is ready! Try running a command from the Command Palette.');
}

export function deactivate() {}
