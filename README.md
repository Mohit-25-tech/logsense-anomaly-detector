# LogSense 🔍

An AI-powered log file analysis and observability platform built with a **Next.js** frontend and a **Flask** backend. Upload one or more `.log` / `.txt` files to get instant anomaly detection, AI root cause analysis, log deduplication, cross-service correlation, and visual trend insights.

---

## ✨ Features

### Core Analysis
- 📁 **Multi-File Upload** — Drag-and-drop one or multiple `.log` / `.txt` files simultaneously with animated upload zone
- 🤖 **AI Root Cause Analysis** — Uses Groq (LLaMA 3.3 70B) to explain the most critical error with root cause, fix steps, and severity scoring
- 📊 **Anomaly Detection & Filtering** — Scikit-learn Isolation Forest flags unusual log entries, with real-time UI filtering by level (ALL / ERROR / WARNING / INFO / DEBUG)
- 📈 **Trend Visualization & Patterns** — Bar charts of log level distribution and automated grouping of top error patterns by module

### Log Intelligence
- 🔏 **Log Deduplication & Fingerprinting** — Normalizes dynamic values (IPs, UUIDs, numbers, paths) using regex, generates SHA-256 fingerprints, and groups near-duplicate logs into unique patterns with occurrence counts, time ranges, and module distribution
- 🔗 **Cross-Service Correlation** — Upload logs from multiple services (e.g., `app.log`, `db.log`, `nginx.log`) to discover cascading failures on a unified timeline with per-source breakdowns and cascade flow visualization

### Platform
- 🌗 **Light/Dark Mode** — Full system-preference aware theming across all pages
- 📄 **Exportable Executive Reports** — Dedicated `/report` dashboard with fingerprint tables, trend charts, and native PDF generation
- 🗄️ **MongoDB Storage** — Raw logs and analysis results are persisted to MongoDB Atlas

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS v4       |
| UI Library | Radix UI, shadcn/ui, Recharts, Lucide Icons             |
| Utilities  | next-themes (dark mode), html-to-image + jsPDF (export) |
| Backend    | Python 3.11+, Flask 3, Flask-CORS                       |
| AI         | Groq API (LLaMA 3.3 70B Versatile)                      |
| ML         | Scikit-learn (Isolation Forest), NumPy, Pandas          |
| Database   | MongoDB Atlas (PyMongo)                                 |
| Package Mgr| pnpm (frontend), pip (backend)                          |

---

## 📁 Project Structure

```
daa_assin/
├── app/                          ← Next.js App Router pages
│   ├── page.tsx                  ← Landing page with feature showcase
│   ├── layout.tsx                ← Root layout with theme provider
│   ├── globals.css               ← Global styles & Tailwind config
│   ├── upload/
│   │   └── page.tsx              ← Multi-file upload & analysis dashboard
│   └── report/
│       └── page.tsx              ← Exportable PDF report page
│
├── components/                   ← Reusable React components
│   ├── upload-zone.tsx           ← Drag-and-drop multi-file upload zone
│   ├── results-section.tsx       ← Analysis results (summary, charts, fingerprints, anomalies)
│   ├── correlation-section.tsx   ← Cross-service cascade & timeline visualization
│   ├── navbar.tsx                ← Top navigation bar
│   ├── logo.tsx                  ← LogSense logo component
│   ├── theme-provider.tsx        ← next-themes provider wrapper
│   ├── theme-toggle.tsx          ← Light/dark mode toggle button
│   └── ui/                       ← shadcn/ui primitives (Button, Card, etc.)
│
├── backend/                      ← Flask Python backend
│   ├── app.py                    ← Flask routes (POST /upload, GET /analyze, GET /health)
│   ├── parser.py                 ← Regex log-line parser (multi-format support)
│   ├── analyzer.py               ← Isolation Forest anomaly detection
│   ├── ai_explain.py             ← Groq API error explanation
│   ├── fingerprint.py            ← Log normalization, SHA-256 hashing & deduplication
│   ├── correlator.py             ← Multi-file cascade detection & timeline builder
│   ├── db.py                     ← PyMongo singleton connection
│   ├── requirements.txt          ← Python dependencies
│   └── .env                      ← Secrets (not committed to git)
│
├── hooks/                        ← Custom React hooks
├── lib/                          ← Shared utility functions
├── styles/                       ← Additional stylesheets
├── public/                       ← Static assets
├── test_logs/                    ← Sample log files for testing correlation
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| pnpm | 8+ |
| Python | 3.11+ |
| MongoDB Atlas | Account with a cluster |
| Groq API Key | Free at [console.groq.com](https://console.groq.com) |

---

### 1. Clone and Install

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
GROQ_API_KEY=gsk_...your-groq-key...
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=LogSense
```

> **Note**: Make sure your current IP address is whitelisted in MongoDB Atlas under **Security → Network Access → IP Access List**.

### 3. Run the Backend

```bash
cd backend
python app.py
```

Flask server starts at **http://localhost:5000**

### 4. Run the Frontend

In a new terminal:

```bash
pnpm dev
```

Next.js app starts at **http://localhost:3000**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload one or more `.log` / `.txt` files (fields: `files` or `file`) |
| `GET`  | `/analyze` | Run anomaly detection, fingerprinting, correlation + AI explanation |
| `GET`  | `/health` | Health check |

### Example: Multi-file Upload

```bash
curl -X POST http://localhost:5000/upload \
  -F "files=@app.log" \
  -F "files=@db.log" \
  -F "files=@nginx.log"
```

### Example Response from `/analyze`

```json
{
  "summary": {
    "total": 412,
    "errors": 18,
    "warnings": 54,
    "info": 320,
    "debug": 20,
    "unique_patterns": 87,
    "sources_count": 3
  },
  "ai_explanation": {
    "error_message": "...",
    "root_cause": "...",
    "fix_steps": ["..."],
    "severity": "HIGH"
  },
  "anomalies": [
    { "timestamp": "...", "level": "ERROR", "module": "...", "message": "...", "source": "app.log" }
  ],
  "fingerprints": [
    {
      "fingerprint_id": "3342d6a2cad4",
      "pattern": "<NUM> requests processed in last <NUM> seconds",
      "level": "INFO",
      "count": 10,
      "first_seen": "2024-03-15 06:07:15",
      "last_seen": "2024-03-15 07:54:25",
      "sample_message": "200 requests processed in last 60 seconds",
      "modules": ["api"]
    }
  ],
  "correlation": {
    "sources": ["app.log", "db.log"],
    "source_breakdown": {
      "app.log": { "total": 200, "errors": 5, "warnings": 20, "info": 170, "debug": 5 },
      "db.log":  { "total": 212, "errors": 13, "warnings": 34, "info": 150, "debug": 15 }
    },
    "cascades": [
      {
        "trigger_source": "db.log",
        "trigger_message": "Connection pool exhausted: max 20 connections",
        "trigger_time": "2024-03-15 06:05:30",
        "affected": [
          { "source": "app.log", "message": "Database timeout after 30s", "time": "2024-03-15 06:05:45" }
        ]
      }
    ],
    "timeline": [
      { "time": "06:05:30", "source": "db.log", "level": "ERROR", "message": "..." }
    ]
  },
  "trends": { "ERROR": 18, "WARNING": 54, "INFO": 320, "DEBUG": 20 }
}
```

---

## 🗄️ MongoDB Collections

| Collection | Contents |
|---|---|
| `logs_raw` | Parsed lines from the most recent upload (tagged with `source` filename) |
| `analysis_results` | Historical analysis results with timestamps |

---

## 🧠 How the Algorithms Work

### Log Fingerprinting (O(n))
1. **Normalize** each log message — strip dynamic values like timestamps, IPs, UUIDs, numbers, and file paths using regex, replacing them with stable placeholders (`<NUM>`, `<IP>`, etc.)
2. **Hash** the normalized `level::message` string using SHA-256, truncated to 12 hex chars
3. **Group** logs by fingerprint, tracking occurrence count, time range, modules, and a sample message

### Cascade Detection (O(n log n))
1. Filter to ERROR-level logs only, parse timestamps, and sort chronologically
2. For each error, scan forward within a 60-second window for errors from *different* source files
3. If found, record a cascade event linking the trigger to its downstream effects
4. De-duplicate consumed events to avoid double-counting

### Anomaly Detection (Isolation Forest)
1. Extract features from logs: level-encoded values, message length, time deltas
2. Fit a Scikit-learn Isolation Forest model with contamination auto-tuning
3. Flag outlier log entries as anomalies

---

## 📄 License

MIT
