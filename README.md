# LogSense 🔍

An AI-powered log file analysis tool built with a **Next.js** frontend and a **Flask** backend. Upload any `.log` or `.txt` file to get instant anomaly detection, AI-powered root cause analysis, and visual trend insights.

---

## ✨ Features

- 📁 **Log File Upload** — Supports `.log` and `.txt` formats with animated drag-and-drop
- 🌗 **Light/Dark Mode** — Full system-preference aware theming across the entire application
- 🤖 **AI Explanation** — Uses Groq (LLaMA 3.3) to explain the most critical error with root cause and fix steps
- 📊 **Anomaly Detection & Filtering** — Scikit-learn Isolation Forest flags unusual log entries, with real-time UI filtering (ALL, ERROR, WARN, etc.)
- 📈 **Trend Visualization & Patterns** — Visual breakdown of log levels (Bar & Pie charts) and automated grouping of top error patterns by module
- 📄 **Exportable Executive Reports** — Dedicated dashboard (`/report`) equipped with native, high-quality PDF generation
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
├── app/                    ← Next.js app router pages
│   └── page.tsx            ← Main upload & analysis page
├── components/             ← Reusable React components
│   ├── upload-zone.tsx
│   ├── results-section.tsx
│   └── ui/                 ← shadcn/ui components
├── backend/                ← Flask Python backend
│   ├── app.py              ← Flask routes (POST /upload, GET /analyze)
│   ├── parser.py           ← Regex log-line parser (multi-format)
│   ├── analyzer.py         ← Isolation Forest anomaly detection
│   ├── ai_explain.py       ← Groq API error explanation
│   ├── db.py               ← PyMongo singleton connection
│   ├── requirements.txt    ← Python dependencies
│   └── .env                ← Secrets (not committed to git)
├── package.json
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
| `POST` | `/upload` | Upload a `.log` or `.txt` file |
| `GET`  | `/analyze` | Run anomaly detection + AI explanation |
| `GET`  | `/health` | Health check |

**Example Response from `/analyze`:**
```json
{
  "summary":        { "total": 412, "errors": 18, "warnings": 54, "info": 320, "debug": 20 },
  "ai_explanation": { "error_message": "...", "root_cause": "...", "fix_steps": [...], "severity": "HIGH" },
  "anomalies":      [ { "timestamp": "...", "level": "ERROR", "module": "...", "message": "..." } ],
  "trends":         { "ERROR": 18, "WARNING": 54, "INFO": 320, "DEBUG": 20 }
}
```

---

## 🗄️ MongoDB Collections

| Collection | Contents |
|---|---|
| `logs_raw` | Parsed lines from the most recent upload |
| `analysis_results` | Historical analysis results with timestamps |

---

## 📄 License

MIT
