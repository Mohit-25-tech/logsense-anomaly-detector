import requests
import json

UPLOAD_URL = "http://localhost:5000/upload"
ANALYZE_URL = "http://localhost:5000/analyze"

files = [
    ('files', ('db.log', open('db.log', 'rb'), 'text/plain')),
    ('files', ('app.log', open('app.log', 'rb'), 'text/plain'))
]

print("Uploading files...")
response = requests.post(UPLOAD_URL, files=files)
print(f"Upload Response: {response.status_code}")
print(json.dumps(response.json(), indent=2))

print("\nAnalyzing logs...")
analyze_response = requests.get(ANALYZE_URL)
print(f"Analyze Response: {analyze_response.status_code}")
data = analyze_response.json()

print("\n=== Sources ===")
print(data.get("correlation", {}).get("sources", []))

print("\n=== Cascades ===")
print(json.dumps(data.get("correlation", {}).get("cascades", []), indent=2))
