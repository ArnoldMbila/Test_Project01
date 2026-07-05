"""Sprachnachrichten-Transkription ueber die OpenAI-Whisper-API (optional)."""

import io

try:
    from openai import OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:  # Paket nicht installiert -> Feature deaktiviert
    _OPENAI_AVAILABLE = False


class Transcriber:
    def __init__(self, api_key: str):
        self._client = (
            OpenAI(api_key=api_key) if api_key and _OPENAI_AVAILABLE else None
        )

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def transcribe(self, data: bytes, filename: str = "voice.ogg") -> str:
        """Blockierender Aufruf — vom Bot aus in einem Thread ausfuehren."""
        result = self._client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, io.BytesIO(data)),
        )
        return result.text.strip()
