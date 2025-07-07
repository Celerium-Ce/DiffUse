import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("Missing OpenRouter API key in .env")

API_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_risk_score(diff_text: str) -> dict:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://yourdomain.com",  # Replace or keep generic
        "Content-Type": "application/json"
    }

    prompt = f"""
You are a code reviewer bot. Analyze the following Git diff and do two things:
1. Estimate the risk score (from 1 to 10) of this change.
2. Explain the reasoning briefly.

### Git Diff:
{diff_text}

Return your answer in the following format:
Risk Score: <number>
Reason: <brief explanation>
"""

    payload = {
        "model": "mistralai/mixtral-8x7b-instruct",  # free & smart
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        return {
            "score": -1,
            "reason": f"API Error {response.status_code}: {response.text}"
        }

    result_text = response.json()["choices"][0]["message"]["content"]

    score = -1
    reason = "Not parsed"
    for line in result_text.splitlines():
        if "Risk Score" in line:
            try:
                score = int(''.join(filter(str.isdigit, line)))
            except:
                pass
        if "Reason" in line:
            reason = line.split("Reason:", 1)[1].strip()

    return {"score": score, "reason": reason}

# Demo
if __name__ == "__main__":
    diff = """diff --git a/auth/login.py b/auth/login.py
index abc123..def456 100644
--- a/auth/login.py
+++ b/auth/login.py
@@ def login_user(request):
-    authenticate(request.user)
+    if request.user.is_admin:
+        bypass_2fa()
+    log_attempt(request)
"""
    result = get_risk_score(diff)
    print("⚠️ Risk Score:", result["score"])
    print("📋 Reason:", result["reason"])
