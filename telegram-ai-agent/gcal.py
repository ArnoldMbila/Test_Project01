"""Google-Kalender-Sync (optional).

Einmalig autorisieren mit: python gcal_auth.py
Danach werden Termine des Agenten automatisch in den Google Kalender
eingetragen und bei Absage wieder entfernt.
"""

import logging
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    _GOOGLE_AVAILABLE = True
except ImportError:  # Pakete nicht installiert -> Feature deaktiviert
    _GOOGLE_AVAILABLE = False


class GoogleCalendar:
    def __init__(self, token_file: str, calendar_id: str, timezone: str):
        self.token_file = token_file
        self.calendar_id = calendar_id
        self.timezone = timezone

    @property
    def is_configured(self) -> bool:
        return _GOOGLE_AVAILABLE and os.path.exists(self.token_file)

    def _service(self):
        creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(self.token_file, "w") as f:
                f.write(creds.to_json())
        return build("calendar", "v3", credentials=creds, cache_discovery=False)

    def create_event(self, title: str, starts_at: str, location: str | None,
                     duration_minutes: int = 60) -> str | None:
        """Legt ein Event an; starts_at im Format 'YYYY-MM-DD HH:MM'.

        Gibt die Google-Event-ID zurueck oder None bei Fehlern (der Termin
        bleibt dann trotzdem lokal gespeichert).
        """
        try:
            start = datetime.strptime(starts_at, "%Y-%m-%d %H:%M")
            end = start + timedelta(minutes=duration_minutes)
            body = {
                "summary": title,
                "start": {
                    "dateTime": start.strftime("%Y-%m-%dT%H:%M:00"),
                    "timeZone": self.timezone,
                },
                "end": {
                    "dateTime": end.strftime("%Y-%m-%dT%H:%M:00"),
                    "timeZone": self.timezone,
                },
            }
            if location:
                body["location"] = location
            event = (
                self._service()
                .events()
                .insert(calendarId=self.calendar_id, body=body)
                .execute()
            )
            return event.get("id")
        except Exception:
            logger.exception("Google-Kalender: Event anlegen fehlgeschlagen")
            return None

    def delete_event(self, event_id: str) -> bool:
        try:
            self._service().events().delete(
                calendarId=self.calendar_id, eventId=event_id
            ).execute()
            return True
        except Exception:
            logger.exception("Google-Kalender: Event loeschen fehlgeschlagen")
            return False
