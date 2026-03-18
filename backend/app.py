"""
app.py — Main Flask application for LogSense backend.

Routes:
  POST /upload   — Accept and parse a .log/.txt file → save to MongoDB
  GET  /analyze  — Run anomaly detection + AI explanation → return JSON

CORS is enabled for http://localhost:3000 (Next.js dev server).
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone

from parser import parse_log_file
from db import get_db
from analyzer import detect_anomalies
from ai_explain import explain_error

load_dotenv()

app = Flask(__name__)

# Allow all origins to avoid "Failed to fetch" CORS issues during development
CORS(app, resources={r"/*": {"origins": "*"}})


# ─────────────────────────────────────────────
# POST /upload
# ─────────────────────────────────────────────
@app.route("/upload", methods=["POST"])
def upload():
    """
    Accept a multipart/form-data file upload (field name: "file").
    Parse all log lines and save to MongoDB collection "logs_raw".
    """
    if "file" not in request.files:
        return jsonify({"error": "No file field in request"}), 400

    f = request.files["file"]
    filename: str = f.filename or ""

    if not (filename.endswith(".log") or filename.endswith(".txt")):
        return jsonify({"error": "Only .log or .txt files are accepted"}), 400

    try:
        content = f.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return jsonify({"error": f"Could not read file: {exc}"}), 400

    parsed_logs = parse_log_file(content)

    if not parsed_logs:
        return jsonify({"error": "No parseable log lines found in the file"}), 422

    db = get_db()
    collection = db["logs_raw"]
    # Clear previous upload before storing new one
    collection.delete_many({})
    collection.insert_many(parsed_logs)

    return jsonify({"success": True, "total_lines": len(parsed_logs)}), 200


# ─────────────────────────────────────────────
# GET /analyze
# ─────────────────────────────────────────────
@app.route("/analyze", methods=["GET"])
def analyze():
    """
    Fetch logs from MongoDB "logs_raw", run anomaly detection and AI
    explanation, then persist results and return them as JSON.
    """
    db = get_db()
    raw_col = db["logs_raw"]

    logs = list(raw_col.find({}, {"_id": 0}))

    if not logs:
        return jsonify({"error": "No logs found. Please upload a log file first."}), 404

    # ── Summary counts ────────────────────────────────────────────────────────
    total = len(logs)
    level_counts = {"ERROR": 0, "WARNING": 0, "INFO": 0, "DEBUG": 0}
    for log in logs:
        lvl = log.get("level", "").upper()
        if lvl in level_counts:
            level_counts[lvl] += 1

    summary = {
        "total": total,
        "errors": level_counts["ERROR"],
        "warnings": level_counts["WARNING"],
        "info": level_counts["INFO"],
        "debug": level_counts["DEBUG"],
    }

    # ── Anomaly detection ─────────────────────────────────────────────────────
    anomalies = detect_anomalies(logs)

    # ── AI explanation for the most critical error ────────────────────────────
    error_logs = [l for l in logs if l.get("level", "").upper() == "ERROR"]
    if error_logs:
        # Pick the anomalous error if available, otherwise the first error
        anomaly_errors = [a for a in anomalies if a.get("level", "").upper() == "ERROR"]
        target_log = anomaly_errors[0] if anomaly_errors else error_logs[0]
        critical_message = target_log.get("message", "")
    else:
        critical_message = logs[0].get("message", "No errors found")

    ai_explanation = explain_error(critical_message)

    # ── Build response payload ────────────────────────────────────────────────
    result = {
        "summary": summary,
        "ai_explanation": ai_explanation,
        "anomalies": anomalies,
        "trends": level_counts,
    }

    # ── Persist analysis result ───────────────────────────────────────────────
    result_col = db["analysis_results"]
    result_col.insert_one(
        {**result, "analyzed_at": datetime.now(timezone.utc).isoformat()}
    )

    return jsonify(result), 200


# ─────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "LogSense API is running!",
        "endpoints": ["/upload (POST)", "/analyze (GET)", "/health (GET)"]
    }), 200


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
