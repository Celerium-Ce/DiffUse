# detect_conflict.py
# Detects and explains merge conflicts using AI

import os
import sys
import subprocess
import requests
import warnings
from dotenv import load_dotenv

# Suppress urllib3 SSL warnings
warnings.filterwarnings('ignore', message='urllib3 v2 only supports OpenSSL 1.1.1+')

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("Missing OpenRouter API key in .env")

API_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_git_status():
    """Get git status to check for merge conflicts."""
    try:
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError:
        return None

def get_conflicted_files():
    """Get list of files with merge conflicts."""
    status = get_git_status()
    if not status:
        return []
    
    conflicted_files = []
    for line in status.splitlines():
        if line.startswith('UU ') or line.startswith('AA '):
            # UU = both modified, AA = both added
            filepath = line[3:].strip()
            conflicted_files.append(filepath)
    return conflicted_files

def read_conflict_content(filepath):
    """Read the content of a conflicted file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

def extract_conflict_sections(content):
    """Extract conflict markers and their content."""
    lines = content.splitlines()
    conflicts = []
    current_conflict = None
    
    for i, line in enumerate(lines):
        if line.startswith('<<<<<<< '):
            # Start of conflict
            current_conflict = {
                'start_line': i + 1,
                'head_branch': line[8:].strip(),
                'head_content': [],
                'base_content': [],
                'merge_content': []
            }
        elif line.startswith('======= ') and current_conflict:
            # Separator between HEAD and merge branch
            current_conflict['in_merge'] = True
        elif line.startswith('>>>>>>> ') and current_conflict:
            # End of conflict
            current_conflict['merge_branch'] = line[8:].strip()
            current_conflict['end_line'] = i + 1
            conflicts.append(current_conflict)
            current_conflict = None
        elif current_conflict:
            # Content inside conflict
            if hasattr(current_conflict, 'in_merge') and current_conflict.get('in_merge'):
                current_conflict['merge_content'].append(line)
            else:
                current_conflict['head_content'].append(line)
    
    return conflicts

def explain_conflict(conflict_data, filepath):
    """Use AI to explain the merge conflict."""
    head_content = '\n'.join(conflict_data['head_content'])
    merge_content = '\n'.join(conflict_data['merge_content'])
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://yourdomain.com",
        "Content-Type": "application/json"
    }
    
    prompt = f"""
You are an expert Git merge conflict resolver. Analyze this merge conflict and provide:
1. A clear explanation of what's conflicting
2. Why the conflict occurred
3. Suggestions for resolution

File: {filepath}
Lines {conflict_data['start_line']}-{conflict_data['end_line']}

HEAD ({conflict_data['head_branch']}) version:
{head_content}

Incoming ({conflict_data['merge_branch']}) version:
{merge_content}

Provide a concise, actionable explanation.
"""
    
    payload = {
        "model": "mistralai/mixtral-8x7b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    try:
        r = requests.post(API_URL, headers=headers, json=payload)
        if r.status_code != 200:
            return f"[ERROR] {r.status_code}: {r.text}"
        
        result = r.json()["choices"][0]["message"]["content"]
        return result.strip()
    except Exception as e:
        return f"Error getting AI explanation: {e}"

def detect_and_explain_conflicts():
    """Main function to detect and explain all merge conflicts."""
    print("🔍 Checking for merge conflicts...")
    
    conflicted_files = get_conflicted_files()
    
    if not conflicted_files:
        print("✅ No merge conflicts detected!")
        return
    
    print(f"⚠️  Found {len(conflicted_files)} conflicted file(s):")
    
    for filepath in conflicted_files:
        print(f"\n📄 {filepath}")
        print("-" * 50)
        
        content = read_conflict_content(filepath)
        conflicts = extract_conflict_sections(content)
        
        if not conflicts:
            print("   No conflict markers found (may be binary file)")
            continue
        
        for i, conflict in enumerate(conflicts, 1):
            print(f"\n   Conflict #{i} (lines {conflict['start_line']}-{conflict['end_line']}):")
            print(f"   HEAD ({conflict['head_branch']}) vs {conflict['merge_branch']}")
            
            # Get AI explanation
            explanation = explain_conflict(conflict, filepath)
            print(f"\n   🤖 AI Analysis:")
            print(f"   {explanation}")
            print()

def simulate_conflict():
    """Create a sample conflict for testing when no real conflicts exist."""
    sample_conflict = {
        'start_line': 10,
        'end_line': 18,
        'head_branch': 'main',
        'merge_branch': 'feature-branch',
        'head_content': [
            'def calculate_total(items):',
            '    total = 0',
            '    for item in items:',
            '        total += item.price',
            '    return total'
        ],
        'merge_content': [
            'def calculate_total(items):',
            '    total = 0.0',
            '    for item in items:',
            '        total += item.price * (1 + item.tax_rate)',
            '    return round(total, 2)'
        ]
    }
    
    print("🧪 Testing with sample conflict...")
    print("📄 sample_file.py")
    print("-" * 50)
    print(f"   Conflict #1 (lines {sample_conflict['start_line']}-{sample_conflict['end_line']}):")
    print(f"   HEAD ({sample_conflict['head_branch']}) vs {sample_conflict['merge_branch']}")
    
    explanation = explain_conflict(sample_conflict, "sample_file.py")
    print(f"\n   🤖 AI Analysis:")
    print(f"   {explanation}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Test mode with sample conflict
        simulate_conflict()
    else:
        # Real conflict detection
        detect_and_explain_conflicts()
