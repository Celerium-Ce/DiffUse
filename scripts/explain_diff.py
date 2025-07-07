# explain_diff.py
# Uses Salesforce/CodeT5-small to generate plain-English explanations of code diffs

import os
import requests
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_API_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("Please set HF_API_TOKEN in your .env")

# Use a model designed for code and text summarization
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

def clean_diff(diff_text: str) -> str:
    """
    Remove git metadata (diff/index headers) and keep only added/removed code lines.
    Also, remove leading '#' and strip whitespace for better summarization.
    """
    lines = []
    for line in diff_text.splitlines():
        # keep lines starting with + or - (but skip the file markers +++/---)
        if (line.startswith("+") or line.startswith("-")) and not line.startswith(("+++","---")):
            code = line[1:].strip()
            # Remove leading '#' and extra whitespace
            if code.startswith('#'):
                code = code[1:].strip()
            lines.append(code)
    return "\n".join(lines) or diff_text

def summarize_diff(diff_text: str) -> str:
    """
    Send the cleaned diff to Hugging Face and return a plain-English summary.
    """
    cleaned = clean_diff(diff_text)
    prompt = (
        "You are an expert code reviewer. In one clear, human sentence, explain the main purpose of this code change for a pull request summary. "
        "Focus on what functionality or behavior is being added, removed, or changed. Avoid repeating code.\n"
        f"Code diff:\n{cleaned}"
    )
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_length": 128,
            "num_beams": 4,
            "early_stopping": True
        }
    }

    r = requests.post(API_URL, headers=headers, json=payload)
    if r.status_code != 200:
        return f"[ERROR] {r.status_code}: {r.text}"

    out = r.json()
    first = out[0] if isinstance(out, list) and out else out
    summary = first.get("generated_text") or first.get("summary_text")
    # Post-process: remove repeated words, collapse whitespace, capitalize first letter
    if isinstance(summary, str):
        import re
        summary = re.sub(r'(\\b\\w+\\b)(?:\\s+\\1\\b)+', r'\\1', summary, flags=re.IGNORECASE)  # remove repeated words
        summary = re.sub(r'\s+', ' ', summary).strip()
        summary = summary[0].upper() + summary[1:] if summary else summary
        return summary
    return str(summary)

if __name__ == "__main__":
    sample_diff = """diff --git a/app.py b/app.py
index 83db48f..f7353ee 100644
--- a/app.py
+++ b/app.py
@@ -10,6 +10,9 @@ def login_user(request):
-    # authenticate user
-    ...
+    # authenticate user with additional logging
+    log_attempt(request)
+    ...
"""
    print("🔍 Summary:\n", summarize_diff(sample_diff))
