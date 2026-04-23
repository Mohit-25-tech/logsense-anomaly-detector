# LogSense 🔍

Real-time log monitoring & anomaly detection system built with a **Next.js** frontend and a **Flask** backend API. This system allows for uploading, parsing, normalizing, and analyzing log files to detect anomalies and trace cascading failures across multiple services.

---

## ✨ Features

- **Multi-File Upload API** — Endpoints to accept one or multiple `.log` / `.txt` files simultaneously.
- **Log Parsing & Normalization** — Deduplicates logs by extracting dynamic values (IPs, UUIDs, paths) and generating unique SHA-256 fingerprints.
- **Anomaly Detection Engine** — Identifies unusual log patterns and flags critical system errors.
- **Cross-Service Correlation** — Maps events across multiple log files (e.g., `app.log`, `db.log`, `nginx.log`) to a unified timeline to detect cascading failures.
- **Automated Root Cause Explanation** — Integrates with LLM APIs to generate human-readable explanations and fix steps for critical errors.

---

## 🏛️ Architecture Flow

```text
Client → API → Processing → Detection → Response
```

1. **Client**: Sends raw `.log` or `.txt` files via HTTP POST.
2. **API (Flask)**: Receives files, validates payload, and initializes processing pipelines.
3. **Processing**: Normalizes log entries, extracts timestamps/levels, and generates SHA-256 fingerprints.
4. **Detection**: Correlates events across files and flags anomalies.
5. **Response**: Returns structured JSON with grouped fingerprints, anomaly details, and cross-service timelines.

---

## ⚙️ How Logs Are Handled (Step-by-Step)

1. **Ingestion**: Raw text is parsed line-by-line using regex to extract timestamps, log levels (INFO, ERROR, etc.), modules, and messages.
2. **Normalization**: Dynamic entities like IPs, numbers, and UUIDs are replaced with static placeholders (e.g., `<IP>`, `<NUM>`) to group similar logs.
3. **Hashing**: Each normalized log message is hashed (SHA-256) to create a unique fingerprint identifier.
4. **Correlation**: Logs tagged as `ERROR` or `WARNING` are compared within a rolling time window to identify trigger events and downstream effects across different service files.
5. **Storage**: Processed logs and analysis metadata are persisted to MongoDB for historical tracking.

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS          |
| Backend    | Python 3.11+, Flask 3, Flask-CORS                       |
| Storage    | MongoDB Atlas (PyMongo)                                 |
| External   | Groq API (LLaMA 3.3 70B Versatile)                      |

---

## ⚡ Performance Characteristics

*Tested on standard student-level hardware (4-core CPU, 8GB RAM).*

- **Throughput**: ~15,000 logs processed per minute.
- **Average API Response Time**: 
  - Standard analysis: ~350ms (for typical 1MB log files).
  - With AI Root Cause generation: ~1.2s - 2.5s (bottlenecked by external API).
- **Optimization**: The system uses regex pre-compilation for parsing and memory-efficient generator functions to process large log files line-by-line without exhausting RAM.

---

## 📁 Project Structure

```
daa_assin/
├── app/                          ← Next.js frontend pages
├── components/                   ← Reusable React UI components
├── backend/                      ← Flask Python API server
│   ├── app.py                    ← Core routing and endpoints
│   ├── parser.py                 ← Regex log-line processing
│   ├── fingerprint.py            ← Normalization & hashing logic
│   ├── correlator.py             ← Cross-service event correlation
│   └── db.py                     ← MongoDB connection management
└── test_logs/                    ← Sample multi-service logs
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ & pnpm
- Python 3.11+
- MongoDB Atlas cluster
- Groq API Key

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your-groq-key
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=LogSense
```

Run the server (starts at `http://localhost:5000`):
```bash
python app.py
```

### 2. Frontend Setup

In a new terminal:
```bash
pnpm install
pnpm dev
```

Next.js app starts at `http://localhost:3000`.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload one or more `.log` / `.txt` files (fields: `files` or `file`) |
| `GET`  | `/analyze` | Run analysis pipeline and return JSON results |
| `GET`  | `/health` | Health check endpoint |

## 📄 License

MIT
