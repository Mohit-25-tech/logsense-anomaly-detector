from app import app
from io import BytesIO
import traceback

client = app.test_client()
try:
    data = {"file": (BytesIO(b"2024-03-18 10:00:00 ERROR auth Login failed"), "test.log")}
    resp = client.post("/upload", data=data)
    print("STATUS:", resp.status_code)
    print("DATA:", resp.data.decode('utf-8'))
except Exception as e:
    traceback.print_exc()
