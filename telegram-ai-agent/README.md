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
Telegram  ⇄  bot.py (python-telegram-bot, Polling + Erinnerungs-Job)
                │
                ▼
             agent.py (Claude Opus 4.8, Tool-Use-Schleife)
                │  Tools: save_task, list_tasks, complete_task, delete_task,
                │         create_appointment, list_appointments, cancel_appointment
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

## Mögliche Erweiterungen

- 🎙 Sprachnachrichten (Whisper-Transkription vorschalten)
- 📅 Google-Kalender-Sync statt lokaler SQLite-Termine
- 🌅 Tägliche Morgen-Zusammenfassung (Termine + offene Aufgaben)
