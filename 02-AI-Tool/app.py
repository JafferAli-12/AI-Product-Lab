"""
AI Text Assistant — Flask backend
=================================

This backend:
  1. Serves the existing frontend (index.html, style.css, app.js).
  2. Provides a health check at /api/health.
  3. Provides POST /api/process, which sends the user's text to Gemini
     (Summarize / Rewrite Professionally / Explain Simply) and returns
     the model's reply.

The API key lives ONLY here on the server (loaded from .env). It is never
sent to the browser, put in a URL, returned in a response, or written to logs.

How to run (from the 02-AI-Tool folder):
    .venv\\Scripts\\python.exe app.py
Then open http://127.0.0.1:5000 in your browser.
"""

import os                          # Read environment variables.
from pathlib import Path           # Work with file paths cross-platform.

from dotenv import load_dotenv     # Load variables from a .env file.
from flask import Flask, jsonify, request, send_from_directory
from google import genai           # Official Google Gen AI SDK.

# ---------------------------------------------------------------------------
# Locate the folder that contains this file, so paths work no matter which
# directory you launch Python from. __file__ is app.py; .parent is its folder.
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

# Load .env from an EXPLICIT path resolved relative to this file.
# (Reloading from the current working directory is fragile — this is not.)
load_dotenv(dotenv_path=BASE_DIR / ".env")

# The API key is read once at startup. We keep it in memory only.
# NOTE: we never print, log, or return this value.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# ---------------------------------------------------------------------------
# Configuration constants — change things here, not scattered in the code.
# ---------------------------------------------------------------------------

# The Gemini model to use. Kept in ONE place so it is easy to change.
GEMINI_MODEL = "gemini-3.8-flash"

# Maximum number of characters we accept for the user's text.
MAX_TEXT_LENGTH = 5000

# The three actions the frontend uses. These keys are the ONLY things the
# browser may send as an "action". The server decides the actual prompt,
# so the browser can never inject its own instructions.
ACTION_PROMPTS = {
    "summarize": (
        "Summarize the text below. Capture the most important points in a "
        "clear, concise way. Keep it faithful to the original. Do not add "
        "new information or opinions."
    ),
    "rewrite": (
        "Rewrite the text below in a professional, polished tone suitable "
        "for a workplace audience. Keep the original meaning intact. Fix "
        "grammar and clarity, but do not change the facts or add details."
    ),
    "explain": (
        "Explain the text below in simple, plain language that a beginner "
        "could understand. Avoid jargon, or define it briefly if needed. "
        "Keep the explanation accurate and easy to follow."
    ),
}

# Create the Flask application object.
app = Flask(__name__)


# ---------------------------------------------------------------------------
# Gemini client
# We create the client lazily (only when first needed) and reuse it. Creating
# it at import time would fail hard if the key is missing, which we handle
# more gracefully in the endpoint instead.
# ---------------------------------------------------------------------------
_client = None


def get_client():
    """Create (once) and return the Gemini client."""
    global _client
    if _client is None:
        # Passing the key explicitly makes it obvious WHERE the credential
        # comes from. It stays on the server only.
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


# ---------------------------------------------------------------------------
# Frontend routes
# We name each file explicitly instead of opening up a whole folder as public
# "static" files. That avoids ever exposing .venv/ or the .env file.
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    """Serve the main page."""
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def styles():
    """Serve the stylesheet."""
    return send_from_directory(BASE_DIR, "style.css", mimetype="text/css")


@app.route("/app.js")
def script():
    """Serve the frontend JavaScript."""
    return send_from_directory(BASE_DIR, "app.js", mimetype="application/javascript")


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/api/health")
def health():
    """
    Health check. Returns JSON confirming the backend is up, and reports
    whether the AI is configured (i.e. a key is present). It never reveals
    the key itself — only a boolean.
    """
    return jsonify({
        "status": "ok",
        "service": "AI Text Assistant backend",
        "ai_configured": bool(GEMINI_API_KEY),
    })


@app.route("/api/process", methods=["POST"])
def process():
    """
    Accept JSON: { "action": "summarize|rewrite|explain", "text": "..." }
    and return { "status": "ok", "action": ..., "result": "..." }.

    All validation happens here on the server — the browser cannot send
    custom prompt instructions.
    """
    # --- 1. Parse the JSON body safely -------------------------------------
    # silent=True means a malformed body returns None instead of raising.
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must be valid JSON.",
        }), 400

    action = data.get("action")
    text = data.get("text")

    # --- 2. Validate the action (must be one of our three) -----------------
    if not isinstance(action, str) or not action:
        return jsonify({
            "status": "error",
            "message": "Missing required field: 'action'.",
        }), 400

    if action not in ACTION_PROMPTS:
        return jsonify({
            "status": "error",
            "message": "Unsupported action. Use one of: summarize, rewrite, explain.",
        }), 400

    # --- 3. Validate the text ----------------------------------------------
    if not isinstance(text, str) or not text.strip():
        return jsonify({
            "status": "error",
            "message": "Missing or empty field: 'text'.",
        }), 400

    text = text.strip()

    if len(text) > MAX_TEXT_LENGTH:
        return jsonify({
            "status": "error",
            "message": f"Text is too long. Please keep it under {MAX_TEXT_LENGTH} characters.",
        }), 400

    # --- 4. Configuration check (before any network call) ------------------
    if not GEMINI_API_KEY:
        # Honest, generic message. No hints about secrets.
        return jsonify({
            "status": "error",
            "message": "The AI service is not configured on the server.",
        }), 503

    # --- 5. Build the prompt and call Gemini -------------------------------
    # We combine OUR instruction (from the whitelist above) with the user's
    # text. The user's text is data, never instructions we execute.
    prompt = f"{ACTION_PROMPTS[action]}\n\n---\n\n{text}"

    try:
        client = get_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
    except Exception:
        # Log a sanitized line only: the action is from our whitelist, so it
        # is safe. We deliberately do NOT log the exception, the key, or the
        # user's text.
        app.logger.error("Gemini API call failed (action=%s)", action)
        return jsonify({
            "status": "error",
            "message": "The AI service could not complete the request. Please try again.",
        }), 502

    # --- 6. Read the model's reply safely ----------------------------------
    try:
        result_text = response.text or ""
    except Exception:
        # Some responses have no text part at all; treat that as empty.
        result_text = ""

    if not result_text.strip():
        return jsonify({
            "status": "error",
            "message": "The AI service returned an empty response. Please try again.",
        }), 502

    # --- 7. Success --------------------------------------------------------
    return jsonify({
        "status": "ok",
        "action": action,
        "result": result_text,
    })


# ---------------------------------------------------------------------------
# Basic error handling
# Flask normally returns HTML error pages. For a JSON API, JSON errors are
# friendlier, so we return JSON consistently.
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(error):
    """Handle unknown URLs with a clear JSON message."""
    return jsonify({"status": "error", "message": "Not found"}), 404


@app.errorhandler(500)
def server_error(error):
    """Handle unexpected server errors without leaking internal details."""
    return jsonify({"status": "error", "message": "Internal server error"}), 500


# ---------------------------------------------------------------------------
# Start the development server.
# This block runs only when you execute this file directly.
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Debug mode is DISABLED by default for safety (the interactive debugger
    # can execute code, and it bypasses our friendly JSON error handlers).
    # Turn it on only while developing, by setting FLASK_DEBUG=1 first:
    #   PowerShell:  $env:FLASK_DEBUG = "1"; .venv\Scripts\python.exe app.py
    debug_mode = os.environ.get("FLASK_DEBUG") == "1"

    # host 127.0.0.1 = only reachable from this computer (safe default).
    app.run(host="127.0.0.1", port=5000, debug=debug_mode)
