import requests

# Test if server is alive
try:
    r = requests.get('http://localhost:5000/health', timeout=5)
    print("HEALTH:", r.status_code, r.json())
except Exception as e:
    print("HEALTH ERROR:", e)

# Test upload
try:
    files = {'file': ('test.log', b'2024-03-18 10:00:00 ERROR auth Login failed\n', 'text/plain')}
    r = requests.post('http://localhost:5000/upload', files=files, timeout=15)
    print("UPLOAD:", r.status_code, r.text)
except Exception as e:
    print("UPLOAD ERROR:", e)
