"""Telegram-Bot: verbindet deinen Telegram-Account (via @BotFather-Bot)
mit dem KI-Agenten. Start: python bot.py
"""

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import config
from agent import AssistantAgent
from storage import Storage

logging.basicConfig(
    format="%(asctime)s %(name)s %(levelname)s: %(message)s",
    level=logging.INFO,
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

storage: Storage
agent: AssistantAgent
TZ: ZoneInfo

HELP_TEXT = (
    "🤖 *Dein KI-Assistent*\n\n"
    "Schreib mir einfach — ich antworte, merke mir Aufgaben und lege "
    "Termine an. Beispiele:\n"
    "• _\"Ich muss morgen die Steuererklaerung abgeben\"_ → Aufgabe\n"
    "• _\"Zahnarzt am Dienstag um 14 Uhr\"_ → Termin mit Erinnerung\n"
    "• Leite mir Nachrichten weiter — ich filtere To-dos heraus.\n\n"
    "*Befehle:*\n"
    "/aufgaben – offene Aufgaben anzeigen\n"
    "/termine – anstehende Termine anzeigen\n"
    "/reset – Gespraechsverlauf loeschen\n"
    "/hilfe – diese Hilfe"
)


def _authorized(update: Update) -> bool:
    if not config.ALLOWED_USER_IDS:
        return True
    user = update.effective_user
    return user is not None and user.id in config.ALLOWED_USER_IDS


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        await update.message.reply_text("⛔ Du bist nicht freigeschaltet.")
        return
    await update.message.reply_markdown(HELP_TEXT)


async def cmd_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    tasks = storage.list_tasks(update.effective_chat.id)
    if not tasks:
        await update.message.reply_text("Keine offenen Aufgaben. 🎉")
        return
    lines = ["📋 Offene Aufgaben:"]
    for t in tasks:
        due = f" (faellig: {t['due']})" if t["due"] else ""
        prio = " ‼️" if t["priority"] == "hoch" else ""
        lines.append(f"#{t['id']} {t['description']}{due}{prio}")
    lines.append("\nZum Abhaken einfach schreiben, z.B. \"Aufgabe 3 erledigt\".")
    await update.message.reply_text("\n".join(lines))


async def cmd_appointments(update: Update,
                           context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    appts = storage.list_appointments(update.effective_chat.id)
    if not appts:
        await update.message.reply_text("Keine anstehenden Termine. 🗓")
        return
    lines = ["🗓 Anstehende Termine:"]
    for a in appts:
        loc = f" @ {a['location']}" if a["location"] else ""
        lines.append(f"#{a['id']} {a['starts_at']} — {a['title']}{loc}")
    await update.message.reply_text("\n".join(lines))


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update):
        return
    storage.clear_history(update.effective_chat.id)
    await update.message.reply_text("🧹 Gespraechsverlauf geloescht.")


async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Freitext-Nachrichten gehen an den KI-Agenten."""
    if not _authorized(update):
        await update.message.reply_text("⛔ Du bist nicht freigeschaltet.")
        return

    chat_id = update.effective_chat.id
    text = update.message.text or update.message.caption
    if not text:
        await update.message.reply_text(
            "Damit kann ich (noch) nichts anfangen — schick mir Text. 🙂"
        )
        return

    # Weitergeleitete Nachrichten kennzeichnen, damit der Agent To-dos filtert
    if update.message.forward_origin is not None:
        text = f"[Weitergeleitete Nachricht — filtere Aufgaben/Termine heraus]\n{text}"

    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)
    try:
        reply = await asyncio.to_thread(agent.handle_message, chat_id, text)
    except Exception:
        logger.exception("Agent-Fehler")
        reply = "Uups, da ist etwas schiefgelaufen. Versuch es bitte nochmal. 🔧"

    await update.message.reply_text(reply)


async def reminder_job(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Laeuft jede Minute und verschickt faellige Termin-Erinnerungen."""
    now_iso = datetime.now(TZ).replace(tzinfo=None, microsecond=0).isoformat(sep=" ")
    for appt in storage.due_reminders(now_iso):
        loc = f"\n📍 {appt['location']}" if appt["location"] else ""
        try:
            await context.bot.send_message(
                chat_id=appt["chat_id"],
                text=(
                    f"⏰ Erinnerung: *{appt['title']}*\n"
                    f"Termin: {appt['starts_at']}{loc}"
                ),
                parse_mode="Markdown",
            )
            storage.mark_reminded(appt["id"])
        except Exception:
            logger.exception("Erinnerung fuer Termin %s fehlgeschlagen", appt["id"])


def main() -> None:
    global storage, agent, TZ
    config.validate()

    TZ = ZoneInfo(config.TIMEZONE)
    storage = Storage(config.DATABASE_PATH)
    agent = AssistantAgent(storage, config.ANTHROPIC_API_KEY, config.TIMEZONE)

    app = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler(["start", "hilfe", "help"], cmd_start))
    app.add_handler(CommandHandler(["aufgaben", "tasks"], cmd_tasks))
    app.add_handler(CommandHandler(["termine", "appointments"], cmd_appointments))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND | filters.CAPTION, on_message)
    )

    app.job_queue.run_repeating(reminder_job, interval=60, first=10)

    if not config.ALLOWED_USER_IDS:
        logger.warning(
            "ALLOWED_USER_IDS ist leer — JEDER kann den Bot benutzen! "
            "Trage deine Telegram-User-ID in .env ein."
        )

    logger.info("Bot gestartet — warte auf Nachrichten...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
