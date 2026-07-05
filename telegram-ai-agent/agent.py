"""KI-Agent: Claude mit Tool-Use fuer Aufgaben- und Terminverwaltung."""

import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import anthropic

from gcal import GoogleCalendar
from storage import Storage

logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-8"
MAX_TOOL_ROUNDS = 8

SYSTEM_PROMPT = """\
Du bist ein persoenlicher KI-Assistent, der ueber Telegram mit deinem Nutzer \
spricht. Du hilfst beim Alltag: Fragen beantworten, Texte schreiben, \
recherchieren, planen — und du verwaltest Aufgaben und Termine.

Verhalte dich so:

1. Antworte auf Deutsch, ausser der Nutzer schreibt in einer anderen Sprache.
2. Antworte kurz und natuerlich — es ist ein Messenger-Chat, kein Aufsatz. \
Nutze gelegentlich passende Emojis, aber sparsam.
3. AUFGABEN AUTOMATISCH ERKENNEN: Wenn der Nutzer etwas erwaehnt, das er \
erledigen muss ("ich muss noch...", "nicht vergessen...", weitergeleitete \
Nachrichten mit To-dos), speichere es unaufgefordert mit save_task und \
bestaetige es in einem kurzen Satz. Frage nur nach, wenn die Aufgabe unklar ist.
4. TERMINE AUTOMATISCH ERKENNEN: Wenn der Nutzer einen Termin erwaehnt \
("Zahnarzt Dienstag 14 Uhr", "Meeting morgen frueh"), lege ihn mit \
create_appointment an. Rechne relative Angaben ("morgen", "naechsten Freitag") \
anhand der aktuellen Zeit in ein konkretes Datum um. Fehlt die Uhrzeit, frage \
kurz nach, statt zu raten.
5. Nutze list_tasks / list_appointments, bevor du Fragen zu bestehenden \
Aufgaben oder Terminen beantwortest — rate nicht aus dem Gedaechtnis.
6. Erfinde keine IDs: Zum Abhaken oder Absagen erst die Liste abrufen, dann \
die passende ID verwenden.
7. Vor jeder Nutzernachricht steht die aktuelle Zeit in eckigen Klammern — \
nutze sie fuer alle Datumsberechnungen.
"""

TOOLS = [
    {
        "name": "save_task",
        "description": (
            "Speichert eine Aufgabe/ein To-do des Nutzers. Auch unaufgefordert "
            "verwenden, wenn der Nutzer etwas Erledigbares erwaehnt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "Kurze, klare Beschreibung der Aufgabe",
                },
                "due": {
                    "type": "string",
                    "description": (
                        "Faelligkeitsdatum/-zeit im Format YYYY-MM-DD oder "
                        "YYYY-MM-DD HH:MM, falls bekannt"
                    ),
                },
                "priority": {
                    "type": "string",
                    "enum": ["hoch", "normal", "niedrig"],
                    "description": "Prioritaet der Aufgabe",
                },
            },
            "required": ["description"],
        },
    },
    {
        "name": "list_tasks",
        "description": "Listet die Aufgaben des Nutzers mit ihren IDs auf.",
        "input_schema": {
            "type": "object",
            "properties": {
                "include_done": {
                    "type": "boolean",
                    "description": "Auch erledigte Aufgaben anzeigen",
                },
            },
        },
    },
    {
        "name": "complete_task",
        "description": "Markiert eine Aufgabe anhand ihrer ID als erledigt.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "integer", "description": "ID der Aufgabe"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "delete_task",
        "description": "Loescht eine Aufgabe anhand ihrer ID endgueltig.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "integer", "description": "ID der Aufgabe"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "create_appointment",
        "description": (
            "Legt einen Termin an. Der Bot erinnert den Nutzer automatisch "
            "vor Beginn per Telegram-Nachricht."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Titel des Termins, z.B. 'Zahnarzt'",
                },
                "starts_at": {
                    "type": "string",
                    "description": (
                        "Beginn im Format YYYY-MM-DD HH:MM (lokale Zeit des "
                        "Nutzers)"
                    ),
                },
                "location": {
                    "type": "string",
                    "description": "Ort des Termins, falls genannt",
                },
                "reminder_minutes": {
                    "type": "integer",
                    "description": (
                        "Wie viele Minuten vorher erinnert werden soll "
                        "(Standard: 30)"
                    ),
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "Dauer des Termins in Minuten (Standard: 60)",
                },
            },
            "required": ["title", "starts_at"],
        },
    },
    {
        "name": "list_appointments",
        "description": "Listet die anstehenden Termine des Nutzers mit IDs auf.",
        "input_schema": {
            "type": "object",
            "properties": {
                "include_past": {
                    "type": "boolean",
                    "description": "Auch vergangene Termine anzeigen",
                },
            },
        },
    },
    {
        "name": "cancel_appointment",
        "description": "Sagt einen Termin anhand seiner ID ab.",
        "input_schema": {
            "type": "object",
            "properties": {
                "appointment_id": {
                    "type": "integer",
                    "description": "ID des Termins",
                },
            },
            "required": ["appointment_id"],
        },
    },
]


class AssistantAgent:
    def __init__(self, storage: Storage, api_key: str, timezone: str,
                 calendar: GoogleCalendar | None = None):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.storage = storage
        self.tz = ZoneInfo(timezone)
        self.calendar = calendar

    def handle_message(self, chat_id: int, text: str) -> str:
        """Verarbeitet eine Nutzernachricht und gibt die Antwort zurueck.

        Blockierender Aufruf — vom Bot aus in einem Thread ausfuehren.
        """
        now = datetime.now(self.tz).strftime("%A, %d.%m.%Y %H:%M")
        user_content = f"[Aktuelle Zeit: {now}]\n{text}"

        messages = self.storage.get_history(chat_id, limit=20)
        messages.append({"role": "user", "content": user_content})

        response = None
        for _ in range(MAX_TOOL_ROUNDS):
            response = self.client.messages.create(
                model=MODEL,
                max_tokens=16000,
                thinking={"type": "adaptive"},
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }],
                tools=TOOLS,
                messages=messages,
            )

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = self._run_tool(chat_id, block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })
                messages.append({"role": "user", "content": tool_results})
                continue

            if response.stop_reason == "pause_turn":
                messages.append({"role": "assistant", "content": response.content})
                continue

            break

        if response is None or response.stop_reason == "refusal":
            return "Das kann ich leider nicht beantworten. 🙈"

        reply = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
        if not reply:
            reply = "Erledigt. ✅"

        self.storage.append_history(chat_id, "user", user_content)
        self.storage.append_history(chat_id, "assistant", reply)
        return reply

    # ------------------------------------------------------------- Tools

    def _run_tool(self, chat_id: int, name: str, tool_input: dict) -> str:
        try:
            return self._dispatch(chat_id, name, tool_input)
        except Exception:
            logger.exception("Tool %s fehlgeschlagen", name)
            return f"Fehler: Tool {name} konnte nicht ausgefuehrt werden."

    def _dispatch(self, chat_id: int, name: str, i: dict) -> str:
        if name == "save_task":
            task_id = self.storage.add_task(
                chat_id,
                i["description"],
                i.get("due"),
                i.get("priority", "normal"),
            )
            return f"Aufgabe #{task_id} gespeichert."

        if name == "list_tasks":
            tasks = self.storage.list_tasks(chat_id, i.get("include_done", False))
            if not tasks:
                return "Keine Aufgaben vorhanden."
            lines = []
            for t in tasks:
                status = "erledigt" if t["done"] else "offen"
                due = f", faellig {t['due']}" if t["due"] else ""
                lines.append(
                    f"#{t['id']} [{status}] {t['description']}"
                    f" (Prio: {t['priority']}{due})"
                )
            return "\n".join(lines)

        if name == "complete_task":
            ok = self.storage.complete_task(chat_id, i["task_id"])
            return ("Aufgabe als erledigt markiert." if ok
                    else f"Keine Aufgabe mit ID {i['task_id']} gefunden.")

        if name == "delete_task":
            ok = self.storage.delete_task(chat_id, i["task_id"])
            return ("Aufgabe geloescht." if ok
                    else f"Keine Aufgabe mit ID {i['task_id']} gefunden.")

        if name == "create_appointment":
            starts_at = _normalize_datetime(i["starts_at"])
            if starts_at is None:
                return (
                    "Fehler: starts_at muss das Format YYYY-MM-DD HH:MM haben."
                )
            appt_id = self.storage.add_appointment(
                chat_id,
                i["title"],
                starts_at,
                i.get("location"),
                int(i.get("reminder_minutes", 30)),
            )
            result = f"Termin #{appt_id} angelegt fuer {starts_at}."
            if self.calendar and self.calendar.is_configured:
                event_id = self.calendar.create_event(
                    i["title"],
                    starts_at,
                    i.get("location"),
                    int(i.get("duration_minutes", 60)),
                )
                if event_id:
                    self.storage.set_google_event_id(appt_id, event_id)
                    result += " In den Google Kalender eingetragen."
                else:
                    result += (
                        " Hinweis: Google-Kalender-Sync ist fehlgeschlagen,"
                        " der Termin ist nur lokal gespeichert."
                    )
            return result

        if name == "list_appointments":
            appts = self.storage.list_appointments(
                chat_id, i.get("include_past", False)
            )
            if not appts:
                return "Keine anstehenden Termine."
            lines = []
            for a in appts:
                loc = f" @ {a['location']}" if a["location"] else ""
                lines.append(
                    f"#{a['id']} {a['starts_at']} — {a['title']}{loc}"
                    f" (Erinnerung {a['reminder_minutes']} Min. vorher)"
                )
            return "\n".join(lines)

        if name == "cancel_appointment":
            appt = self.storage.get_appointment(chat_id, i["appointment_id"])
            ok = self.storage.cancel_appointment(chat_id, i["appointment_id"])
            if not ok:
                return f"Kein Termin mit ID {i['appointment_id']} gefunden."
            if (appt and appt.get("google_event_id")
                    and self.calendar and self.calendar.is_configured):
                self.calendar.delete_event(appt["google_event_id"])
                return "Termin abgesagt und aus dem Google Kalender entfernt."
            return "Termin abgesagt."

        return f"Unbekanntes Tool: {name}"


def _normalize_datetime(value: str) -> str | None:
    """Bringt Datumsangaben in das Speicherformat 'YYYY-MM-DD HH:MM'."""
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value.strip(), fmt).strftime("%Y-%m-%d %H:%M")
        except ValueError:
            continue
    return None
