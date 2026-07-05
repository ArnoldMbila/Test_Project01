"""Konfiguration ueber Umgebungsvariablen (.env wird automatisch geladen)."""

import os

from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
TIMEZONE = os.environ.get("TIMEZONE", "Europe/Berlin")
DATABASE_PATH = os.environ.get("DATABASE_PATH", "assistant.db")

# Optional: Sprachnachrichten-Transkription (OpenAI Whisper)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Optional: Google-Kalender-Sync (einmalig autorisieren: python gcal_auth.py)
GOOGLE_CLIENT_SECRET_FILE = os.environ.get(
    "GOOGLE_CLIENT_SECRET_FILE", "google_client_secret.json"
)
GOOGLE_TOKEN_FILE = os.environ.get("GOOGLE_TOKEN_FILE", "google_token.json")
GOOGLE_CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "primary")

# Taegliche Morgen-Zusammenfassung im Format HH:MM (leer = deaktiviert)
MORNING_SUMMARY_TIME = os.environ.get("MORNING_SUMMARY_TIME", "07:00")

ALLOWED_USER_IDS = {
    int(part)
    for part in os.environ.get("ALLOWED_USER_IDS", "").replace(" ", "").split(",")
    if part
}


def validate() -> None:
    missing = []
    if not TELEGRAM_BOT_TOKEN:
        missing.append("TELEGRAM_BOT_TOKEN")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if missing:
        raise SystemExit(
            f"Fehlende Umgebungsvariablen: {', '.join(missing)} "
            "(siehe .env.example)"
        )
