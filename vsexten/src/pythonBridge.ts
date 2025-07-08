import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface DiffAnalysisResult {
    explanation?: string;
    risk?: {
        score: number;
        reason: string;
    };
    conflicts?: string;
    error?: string;
}

export class PythonBridge {
    private extensionPath: string;
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        // Get the path to the root of the extension
        this.extensionPath = context.extensionPath;
        this.context = context;
        
        // Log paths to help debug
        console.log('📂 Extension path:', this.extensionPath);
        console.log('📂 Parent directory:', path.dirname(this.extensionPath));
    }

    /**
     * Find the path to the Python scripts
     */
    private getPythonScriptPath(scriptName: string): string {
        // First check if scripts are in the parent directory of the extension
        const parentPath = path.dirname(this.extensionPath);
        const mainRepoScriptPath = path.join(parentPath, 'scripts', scriptName);
        
        if (fs.existsSync(mainRepoScriptPath)) {
            return mainRepoScriptPath;
        }
        
        // Fallback to extension directory
        const extensionScriptPath = path.join(this.extensionPath, 'scripts', scriptName);
        if (fs.existsSync(extensionScriptPath)) {
            return extensionScriptPath;
        }
        
        throw new Error(`Could not find Python script: ${scriptName}`);
    }

    /**
     * Run a Python script with the given diff text as input
     */
    private async runPythonScript(scriptName: string, diffText: string): Promise<string> {
        try {
            const scriptPath = this.getPythonScriptPath(scriptName);
            console.log(`Running Python script: ${scriptPath}`);
            
            // Get the API key
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                throw new Error('No API key found. Please set your OpenRouter API key in settings.');
            }
            
            // Create a temporary file for the diff text
            const tempDiffFile = path.join(this.extensionPath, '.temp_diff.txt');
            fs.writeFileSync(tempDiffFile, diffText);
            
            // Run the Python script with the API key in environment
            const command = `python "${scriptPath}" < "${tempDiffFile}"`;
            console.log(`Executing: ${command}`);
            
            const { stdout, stderr } = await execAsync(command, {
                env: { ...process.env, OPENROUTER_API_KEY: apiKey }
            });
            
            // Clean up the temporary file
            fs.unlinkSync(tempDiffFile);
            
            if (stderr) {
                console.error(`Python script error: ${stderr}`);
            }
            
            return stdout.trim();
        } catch (error) {
            console.error(`Error running Python script: ${error}`);
            throw error;
        }
    }

    /**
     * Get the API key from VS Code settings or secrets
     */
    private async getApiKey(): Promise<string | undefined> {
        // Try to get from VS Code settings first
        const config = vscode.workspace.getConfiguration('diffuse');
        let apiKey = config.get<string>('openrouterApiKey');
        
        // If no API key is found in settings, prompt the user
        if (!apiKey) {
            console.log('💬 No API key found, prompting user...');
            const input = await vscode.window.showInputBox({
                prompt: 'Enter your OpenRouter API key (get one at openrouter.ai)',
                password: true,
                ignoreFocusOut: true,
                placeHolder: 'sk-or-v1-...'
            });
            
            if (input) {
                console.log('✅ User provided API key, storing in settings...');
                await config.update('openrouterApiKey', input, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('API key saved successfully!');
                return input;
            } else {
                console.log('❌ User cancelled API key input');
                throw new Error('API key required to use DiffUse');
            }
        }
        
        return apiKey;
    }

    /**
     * Explain the given diff using the Python backend
     */
    public async explainDiff(diffText: string): Promise<string> {
        try {
            return await this.runPythonScript('explain_diff.py', diffText);
        } catch (error) {
            throw new Error(`Failed to explain diff: ${error}`);
        }
    }

    /**
     * Assess the risk of the given diff using the Python backend
     */
    public async assessRisk(diffText: string): Promise<{score: number, reason: string}> {
        try {
            const result = await this.runPythonScript('risk_score.py', diffText);
            const parsed = JSON.parse(result);
            return {
                score: parsed.score,
                reason: parsed.reason
            };
        } catch (error) {
            throw new Error(`Failed to assess risk: ${error}`);
        }
    }

    /**
     * Detect conflicts in the given diff using the Python backend
     */
    public async detectConflicts(diffText: string): Promise<string> {
        try {
            return await this.runPythonScript('detect_conflict.py', diffText);
        } catch (error) {
            throw new Error(`Failed to detect conflicts: ${error}`);
        }
    }

    /**
     * Perform full analysis on the given diff using the Python backend
     */
    public async fullAnalysis(diffText: string): Promise<DiffAnalysisResult> {
        try {
            const [explanation, riskResult, conflicts] = await Promise.all([
                this.explainDiff(diffText),
                this.assessRisk(diffText),
                this.detectConflicts(diffText)
            ]);
            
            return {
                explanation,
                risk: riskResult,
                conflicts
            };
        } catch (error) {
            console.error(`Analysis error: ${error}`);
            return {
                error: `Analysis failed: ${error}`
            };
        }
    }
}