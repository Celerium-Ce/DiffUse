// pythonBridge.ts
// Provides a bridge between VS Code extension and Python scripts

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Represents the result of a diff analysis from DiffUse Python scripts
 */
export interface DiffAnalysis {
    explanation?: string;
    risk?: {
        score: number;
        reason: string;
    };
    conflicts?: string;
}

/**
 * Provides methods to interact with the DiffUse Python scripts
 */
export class PythonBridge {
    private extensionPath: string;
    
    constructor(context: vscode.ExtensionContext) {
        this.extensionPath = context.extensionPath;
    }
    
    /**
     * Find the scripts directory from different possible locations
     */
    private async findScriptsDirectory(): Promise<string> {
        // First, check if we're in the extension directory
        const extensionScriptsPath = path.join(this.extensionPath, '..', 'scripts');
        
        if (fs.existsSync(extensionScriptsPath)) {
            return extensionScriptsPath;
        }
        
        // Next, check if we're in the main repository
        const repositoryScriptsPath = path.join(this.extensionPath, 'scripts');
        
        if (fs.existsSync(repositoryScriptsPath)) {
            return repositoryScriptsPath;
        }
        
        // If neither location has the scripts, we need to bundle them with the extension
        const bundledScriptsPath = path.join(this.extensionPath, 'scripts');
        
        if (!fs.existsSync(bundledScriptsPath)) {
            throw new Error('Could not locate DiffUse scripts directory');
        }
        
        return bundledScriptsPath;
    }
    
    /**
     * Get the explanation for a diff
     */
    public async explainDiff(diff: string): Promise<string> {
        const scriptsDir = await this.findScriptsDirectory();
        const scriptPath = path.join(scriptsDir, 'explain_diff.py');
        
        try {
            // Create a temporary file to store the diff
            const tempFile = path.join(os.tmpdir(), `diffuse-${Date.now()}.diff`);
            fs.writeFileSync(tempFile, diff);
            
            const { stdout } = await execAsync(`python3 "${scriptPath}" "${tempFile}"`, { 
                env: {
                    ...process.env,
                    // Pass the API key as environment variable if available
                    OPENROUTER_API_KEY: await this.getApiKey() || process.env.OPENROUTER_API_KEY
                }
            });
            
            // Clean up the temp file
            fs.unlinkSync(tempFile);
            
            return stdout.trim();
        } catch (error: any) {
            console.error('Error explaining diff:', error);
            return `Error explaining diff: ${error.message}`;
        }
    }
    
    /**
     * Get the risk assessment for a diff
     */
    public async getRiskScore(diff: string): Promise<{ score: number; reason: string }> {
        const scriptsDir = await this.findScriptsDirectory();
        const scriptPath = path.join(scriptsDir, 'risk_score.py');
        
        try {
            // Create a temporary file to store the diff
            const tempFile = path.join(os.tmpdir(), `diffuse-${Date.now()}.diff`);
            fs.writeFileSync(tempFile, diff);
            
            const { stdout } = await execAsync(`python3 "${scriptPath}" "${tempFile}"`, { 
                env: {
                    ...process.env,
                    OPENROUTER_API_KEY: await this.getApiKey() || process.env.OPENROUTER_API_KEY
                }
            });
            
            // Clean up the temp file
            fs.unlinkSync(tempFile);
            
            // Parse the output from the risk score script
            const scoreMatch = stdout.match(/Risk Score: (\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
            
            // Extract the reason from the output
            const reasonMatch = stdout.match(/Reason: (.+)/s);
            const reason = reasonMatch ? reasonMatch[1].trim() : 'No reason provided';
            
            return { score, reason };
        } catch (error: any) {
            console.error('Error getting risk score:', error);
            return { score: 0, reason: `Error: ${error.message}` };
        }
    }
    
    /**
     * Detect conflicts in a diff
     */
    public async detectConflicts(diff: string): Promise<string> {
        const scriptsDir = await this.findScriptsDirectory();
        const scriptPath = path.join(scriptsDir, 'detect_conflict.py');
        
        try {
            // Create a temporary file to store the diff
            const tempFile = path.join(os.tmpdir(), `diffuse-${Date.now()}.diff`);
            fs.writeFileSync(tempFile, diff);
            
            const { stdout } = await execAsync(`python3 "${scriptPath}" "${tempFile}"`, { 
                env: {
                    ...process.env,
                    OPENROUTER_API_KEY: await this.getApiKey() || process.env.OPENROUTER_API_KEY
                }
            });
            
            // Clean up the temp file
            fs.unlinkSync(tempFile);
            
            return stdout.trim();
        } catch (error: any) {
            console.error('Error detecting conflicts:', error);
            return `Error detecting conflicts: ${error.message}`;
        }
    }
    
    /**
     * Perform a full analysis of a diff
     */
    public async fullAnalysis(diff: string): Promise<DiffAnalysis> {
        const explanation = await this.explainDiff(diff);
        const risk = await this.getRiskScore(diff);
        const conflicts = await this.detectConflicts(diff);
        
        return {
            explanation,
            risk,
            conflicts
        };
    }
    
    /**
     * Get the API key from VS Code settings or secrets
     */
    private async getApiKey(): Promise<string | undefined> {
        // This should match the getApiKey method in the main extension
        const config = vscode.workspace.getConfiguration('diffuse');
        return config.get<string>('openrouterApiKey');
    }
}
