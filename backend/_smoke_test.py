from parser import parse_log_file
from db import get_db
from analyzer import detect_anomalies
from ai_explain import explain_error
from flask import Flask
from flask_cors import CORS

print("--- Import test PASSED ---")

sample = (
    "2024-01-15 10:23:45,123 ERROR auth.service: Connection refused to DB\n"
    "2024-01-15 10:23:46,200 WARNING cache: Redis timeout\n"
    "2024-01-15 10:23:47,300 INFO  app: Request handled in 120ms\n"
    "2024-01-15 10:23:48,100 DEBUG router: GET /api/health 200\n"
)

logs = parse_log_file(sample)
print("Parsed", len(logs), "lines:", [l["level"] for l in logs])

anomalies = detect_anomalies(logs)
print("Anomalies detected:", len(anomalies))

ai = explain_error("Connection refused to DB")
print("AI severity:", ai.get("severity"))
print("AI root_cause snippet:", ai.get("root_cause", "")[:80])

print("--- All systems GO ---")
