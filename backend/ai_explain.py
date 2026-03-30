"""
ai_explain.py — Groq API call to explain the most critical log error.
Uses groq's fast inference (llama-3.3-70b-versatile) to return:
  root_cause, fix_steps (list), severity label.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def explain_error(error_message: str) -> dict:
    """
    Send the most critical error log line to Groq and get a structured
    explanation back.

    Returns
    -------
    dict with keys:
        error_message : str   (original line passed in)
        root_cause    : str   (1-2 sentence explanation)
        fix_steps     : list  (ordered list of remediation steps)
        severity      : str   (CRITICAL | HIGH | MEDIUM | LOW)
    """
    api_key = os.getenv("GROQ_API_KEY", "")

    # Graceful fallback when no API key is configured
    if not api_key or api_key.startswith("your_"):
        return _fallback_explanation(error_message)

    client = Groq(api_key=api_key)

    system_prompt = (
        "You are an expert DevOps and software reliability engineer. "
        "You will be given a single log error message. "
        "Respond ONLY with a valid JSON object (no markdown, no extra text) with these exact keys:\n"
        '  "root_cause": "string — concise 1-2 sentence explanation of why this error occurs",\n'
        '  "fix_steps": ["step 1", "step 2", ...],\n'
        '  "severity": "CRITICAL | HIGH | MEDIUM | LOW"\n'
    )

    user_prompt = f"Log error message:\n{error_message}"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=512,
        )
        raw = response.choices[0].message.content.strip()

        # Strip possible markdown code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        parsed = json.loads(raw)
        
        # Validate and sanitize fields
        root_cause = parsed.get("root_cause", "Unable to determine root cause.")
        if not isinstance(root_cause, str):
            root_cause = str(root_cause)
            
        fix_steps = parsed.get("fix_steps", [])
        if not isinstance(fix_steps, list):
            # If it's a string, try to split it or wrap it
            if isinstance(fix_steps, str):
                fix_steps = [fix_steps]
            else:
                fix_steps = []
        
        # Ensure all steps are strings
        fix_steps = [str(step) for step in fix_steps if step]

        return {
            "error_message": error_message,
            "root_cause": root_cause,
            "fix_steps": fix_steps,
            "severity": parsed.get("severity", "MEDIUM"),
        }
    except json.JSONDecodeError:
        return _fallback_explanation(error_message)
    except Exception as exc:
        return {
            "error_message": error_message,
            "root_cause": f"Groq API call failed: {exc}",
            "fix_steps": ["Check your GROQ_API_KEY in backend/.env", "Ensure the Groq SDK is installed: pip install groq"],
            "severity": "UNKNOWN",
        }


def _fallback_explanation(error_message: str) -> dict:
    """Static fallback when Groq API is not configured."""
    return {
        "error_message": error_message,
        "root_cause": (
            "Groq API key is not configured. "
            "Set GROQ_API_KEY in backend/.env to enable AI-powered analysis."
        ),
        "fix_steps": [
            "Open backend/.env",
            "Set GROQ_API_KEY=gsk_... with your actual Groq API key",
            "Restart the Flask server",
        ],
        "severity": "UNKNOWN",
    }
