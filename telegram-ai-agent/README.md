# 🤖 Telegram KI-Agent

Ein persönlicher KI-Assistent für **dein echtes Telegram**, angetrieben von
Claude (Anthropic). Du schreibst ihm wie einem Freund — er antwortet,
**filtert automatisch Aufgaben aus deinen Nachrichten heraus**, **legt Termine
an** und **erinnert dich rechtzeitig** per Telegram-Nachricht.

## Funktionen

| Funktion | Beschreibung |
|---|---|
| 💬 Chatbot | Natürliche Unterhaltung mit Claude (Fragen, Texte, Recherche, Planung) — mit Gesprächsgedächtnis pro Chat |
| ✅ Aufgaben-Filter | Erkennt To-dos automatisch ("ich muss noch…", weitergeleitete Nachrichten) und speichert sie |
| 🗓 Termine | Versteht "Zahnarzt Dienstag 14 Uhr", legt den Termin an und rechnet relative Angaben ("morgen") selbst um |
| ⏰ Erinnerungen | Schickt dir vor jedem Termin automatisch eine Erinnerung (Standard: 30 Min. vorher) |
| 🎙 Sprachnachrichten | Schick eine Sprachnachricht — sie wird per Whisper transkribiert und wie Text verarbeitet (optional) |
| 📅 Google Kalender | Termine landen automatisch auch in deinem Google Kalender, Absagen werden dort entfernt (optional) |
| 🌅 Morgen-Zusammenfassung | Täglich (Standard 07:00) eine Übersicht mit heutigen Terminen und offenen Aufgaben |
| 🔒 Privat | Nur deine Telegram-User-ID darf den Bot benutzen |

## So verknüpfst du den Agenten mit deinem Telegram

Der Agent verbindet sich über einen **Telegram-Bot** mit deinem echten
Account — das ist der offizielle, sichere Weg (kein Zugriff auf dein
Passwort, keine Session-Übernahme).

### 1. Bot bei Telegram erstellen (2 Minuten)

1. Öffne Telegram und suche **@BotFather** (offizieller Telegram-Bot).
2. Sende `/newbot` und folge den Anweisungen (Name + Benutzername wählen).
3. BotFather schickt dir einen **Token** wie `123456789:AAE...` — kopieren!

### 2. Deine Telegram-User-ID herausfinden

1. Suche in Telegram den Bot **@userinfobot** und starte ihn.
2. Er antwortet mit deiner numerischen User-ID (z.B. `987654321`).

### 3. Anthropic API-Key besorgen

1. Auf [platform.claude.com](https://platform.claude.com) registrieren.
2. Unter *API Keys* einen Key erstellen (`sk-ant-...`).

### 4. Installation

```bash
cd telegram-ai-agent
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env öffnen und eintragen:
#   TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY, ALLOWED_USER_IDS
```

### 5. Starten

```bash
python bot.py
```

Jetzt in Telegram deinen Bot öffnen (der Name aus Schritt 1), `/start`
senden — fertig! 🎉

> Für Dauerbetrieb den Bot auf einem Server/Raspberry Pi laufen lassen,
> z.B. mit `systemd`, `tmux` oder Docker.

## Optionale Funktionen einrichten

### 🎙 Sprachnachrichten (Whisper)

1. OpenAI API-Key erstellen ([platform.openai.com](https://platform.openai.com)).
2. In `.env` eintragen: `OPENAI_API_KEY=sk-...`
3. Bot neu starten — Sprachnachrichten werden jetzt transkribiert, als
   Text angezeigt und ganz normal vom Agenten verarbeitet (inkl.
   Aufgaben-/Termin-Erkennung: einfach "Erinner mich morgen an XY"
   einsprechen).

### 📅 Google-Kalender-Sync

1. In der [Google Cloud Console](https://console.cloud.google.com) ein
   Projekt anlegen und die **Google Calendar API** aktivieren.
2. Unter *APIs & Dienste → Anmeldedaten* eine **OAuth-Client-ID** vom Typ
   **Desktop-App** erstellen und das JSON herunterladen.
3. Die Datei als `google_client_secret.json` in den Projektordner legen
   (Pfad anpassbar über `GOOGLE_CLIENT_SECRET_FILE`).
4. Einmalig autorisieren:
   ```bash
   python gcal_auth.py
   ```
   Es öffnet sich ein Browserfenster zum Google-Login; das Token wird als
   `google_token.json` gespeichert.
5. Bot neu starten — ab jetzt werden neue Termine automatisch in deinen
   Google Kalender eingetragen (Standard: Hauptkalender `primary`,
   änderbar über `GOOGLE_CALENDAR_ID`) und bei Absage dort entfernt.

### 🌅 Tägliche Morgen-Zusammenfassung

Standardmäßig aktiv um **07:00 Uhr**: Der Bot schickt dir eine Übersicht
mit den heutigen Terminen und deinen offenen Aufgaben. Uhrzeit ändern oder
deaktivieren über `.env`:

```env
MORNING_SUMMARY_TIME=06:30   # andere Uhrzeit
MORNING_SUMMARY_TIME=        # deaktivieren
```

## Benutzung

Einfach schreiben — Beispiele:

- *"Was ist der Unterschied zwischen Miete und Pacht?"* → normale KI-Antwort
- *"Ich muss noch die Steuererklärung machen, spätestens Freitag"* → Aufgabe wird gespeichert
- *"Zahnarzt am Dienstag um 14 Uhr in der Hauptstraße"* → Termin + Erinnerung
- Nachricht **weiterleiten** → der Agent filtert enthaltene To-dos/Termine heraus
- *"Was steht diese Woche an?"* → Agent schaut in deine Termine und Aufgaben
- *"Aufgabe 3 ist erledigt"* → wird abgehakt

### Befehle

| Befehl | Wirkung |
|---|---|
| `/aufgaben` | Offene Aufgaben anzeigen |
| `/termine` | Anstehende Termine anzeigen |
| `/reset` | Gesprächsverlauf löschen (Aufgaben/Termine bleiben) |
| `/hilfe` | Hilfe anzeigen |

## Architektur

```
Telegram  ⇄  bot.py (python-telegram-bot, Polling + Minuten-Job:
                │    Erinnerungen & Morgen-Zusammenfassung)
                ├── voice.py (optional: Whisper-Transkription)
                ▼
             agent.py (Claude Opus 4.8, Tool-Use-Schleife)
                │  Tools: save_task, list_tasks, complete_task, delete_task,
                │         create_appointment, list_appointments, cancel_appointment
                ├── gcal.py (optional: Google-Kalender-Sync)
                ▼
             storage.py (SQLite: Aufgaben, Termine, Chat-Verlauf)
```

- **Modell:** `claude-opus-4-8` mit adaptivem Thinking; der System-Prompt wird
  per Prompt-Caching gecacht (spart Kosten bei jeder Nachricht).
- **Erinnerungen:** Ein Job prüft jede Minute die Datenbank und verschickt
  fällige Erinnerungen — übersteht dadurch auch Neustarts des Bots.
- **Zeitzone:** über `TIMEZONE` in `.env` konfigurierbar (Standard
  `Europe/Berlin`); der Agent bekommt die aktuelle Zeit bei jeder Nachricht
  mitgeteilt und rechnet "morgen 9 Uhr" selbst um.

## Konfiguration (`.env`)

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token von @BotFather |
| `ANTHROPIC_API_KEY` | ✅ | API-Key von platform.claude.com |
| `ALLOWED_USER_IDS` | empfohlen | Deine Telegram-User-ID(s), Komma-getrennt |
| `TIMEZONE` | – | IANA-Zeitzone, Standard `Europe/Berlin` |
| `DATABASE_PATH` | – | Pfad zur SQLite-Datei, Standard `assistant.db` |
| `OPENAI_API_KEY` | – | Aktiviert Sprachnachrichten (Whisper) |
| `GOOGLE_CLIENT_SECRET_FILE` | – | OAuth-Client-JSON für den Kalender-Sync |
| `GOOGLE_TOKEN_FILE` | – | Token-Datei (wird von `gcal_auth.py` erzeugt) |
| `GOOGLE_CALENDAR_ID` | – | Ziel-Kalender, Standard `primary` |
| `MORNING_SUMMARY_TIME` | – | Uhrzeit der Tagesübersicht (HH:MM), leer = aus |
