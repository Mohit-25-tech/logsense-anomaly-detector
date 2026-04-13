"""
db.py — MongoDB connection singleton using PyMongo.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client: MongoClient | None = None
DB_NAME = "logsense"

def get_db():
    """Return the logsense MongoDB database, creating the client once."""
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/logsense")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    return _client[DB_NAME]
