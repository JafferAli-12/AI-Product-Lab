# AI Text Assistant — Project 2

A small web app that sends your text to Google Gemini and returns one of three results:

- **Summarize** — condense the text to its key points.
- **Rewrite Professionally** — restate it in a polished, workplace tone.
- **Explain Simply** — describe it in plain, beginner-friendly language.

The API key stays on the Python server. It is never sent to the browser.

---

## Features

| Feature | Details |
|---------|---------|
| Three actions | Summarize / Rewrite Professionally / Explain Simply |
| Live character counter | 0–5,000 characters, warns near the limit |
| Server-side validation | Rejects bad input, unknown actions, and over-length text |
| Loading state | Disables the button and blocks duplicate submissions |
| Friendly errors | Clear messages for empty input, network, and server errors |
| Safe rendering | AI output is shown as plain text (never injected as HTML) |
| Local only | Binds to `127.0.0.1`; debug mode is off unless opted in |

---

## Project Files

```
02-AI-Tool/
├── app.py            # Flask backend: serves the frontend + /api/process + /api/health
├── index.html        # Frontend markup
├── style.css         # Styling
├── app.js            # Frontend logic (calls /api/process)
├── requirements.txt  # Python dependencies
├── .env              # Your secret API key (NOT committed — create it yourself)
└── .venv/            # Virtual environment (NOT committed)
```

---

## Setup on Windows

Run these from the `02-AI-Tool` folder (the commands use `py`, the Windows Python launcher).

**1. Create and activate a virtual environment**
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**2. Install dependencies**
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

---

## Configure your API key (`.env`)

Create a file named **`.env`** in the `02-AI-Tool` folder with this one line:

```
GEMINI_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with your real key. Do **not** commit this file — `.gitignore`
already excludes `.env`.

> **Windows tip:** Notepad silently adds `.txt`. When saving, set "Save as type" to
> **All files** (or type the name as `".env"` including quotes) so the file is called
> `.env`, not `.env.txt`.

Get a key from Google AI Studio.

---

## Run the app

From the `02-AI-Tool` folder:

```powershell
.\.venv\Scripts\python.exe app.py
```

Then open **http://127.0.0.1:5000** in your browser.

> **Important:** Open the app through `http://127.0.0.1:5000` — do **not** double-click
> `index.html`. The page sends requests to `/api/process`, which only works when Flask is
> serving it. Opening the file directly (`file://…`) will fail.

To stop the server, press **Ctrl+C** in the terminal.

### Optional: enable debug mode while developing

```powershell
$env:FLASK_DEBUG = "1"; .\.venv\Scripts\python.exe app.py
```

Debug mode gives auto-reload and detailed error pages. Leave it off otherwise — the
interactive debugger can execute code and should never be exposed.

---

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serves the web page |
| GET | `/api/health` | Reports `{ status, service, ai_configured }` |
| POST | `/api/process` | Body `{ "action": "summarize", "text": "..." }` → `{ status, action, result }` |

`action` must be one of `summarize`, `rewrite`, `explain`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| "Could not reach the server" in the page | Flask isn't running, wrong URL, or you opened `index.html` directly. Start `app.py` and use `http://127.0.0.1:5000` |
| "The AI service is not configured on the server." | `.env` is missing, mis-named (e.g. `.env.txt`), or `GEMINI_API_KEY` is empty. Fix the file and restart the server |
| "The AI service could not complete the request." | Transient Gemini error or bad key/quota. Wait and retry; check your key and usage limits |
| Key not picked up after editing `.env` | Restart the server — `.env` is read at startup |
| `python` opens the Microsoft Store | Use `py` instead of `python` on Windows |
| Port 5000 already in use | Another process is using it; stop it or change the port in `app.py` |

---

*Part of the AI-Product-Lab learning series.*
