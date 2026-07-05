"""Einmalige Google-Kalender-Autorisierung.

Voraussetzung: OAuth-Client-Datei (Desktop-App) aus der Google Cloud Console,
gespeichert unter dem Pfad aus GOOGLE_CLIENT_SECRET_FILE (.env).

Ausfuehren mit:  python gcal_auth.py
Es oeffnet sich ein Browserfenster zum Google-Login; danach liegt das Token
unter GOOGLE_TOKEN_FILE und der Bot synchronisiert Termine automatisch.
"""

import os

from google_auth_oauthlib.flow import InstalledAppFlow

import config
from gcal import SCOPES


def main() -> None:
    if not os.path.exists(config.GOOGLE_CLIENT_SECRET_FILE):
        raise SystemExit(
            f"OAuth-Client-Datei nicht gefunden: {config.GOOGLE_CLIENT_SECRET_FILE}\n"
            "1. https://console.cloud.google.com -> Projekt anlegen\n"
            "2. 'Google Calendar API' aktivieren\n"
            "3. OAuth-Client-ID (Typ 'Desktop-App') erstellen und JSON "
            "herunterladen\n"
            "4. Datei unter obigem Pfad speichern (oder Pfad in .env anpassen)"
        )

    flow = InstalledAppFlow.from_client_secrets_file(
        config.GOOGLE_CLIENT_SECRET_FILE, SCOPES
    )
    creds = flow.run_local_server(port=0)
    with open(config.GOOGLE_TOKEN_FILE, "w") as f:
        f.write(creds.to_json())
    print(f"✅ Token gespeichert: {config.GOOGLE_TOKEN_FILE}")
    print("Der Bot synchronisiert Termine ab jetzt mit deinem Google Kalender.")


if __name__ == "__main__":
    main()
