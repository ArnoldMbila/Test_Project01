# FokusPrompter 🎯

Ein ADHS- und legasthenie-freundlicher Teleprompter für Videoaufnahmen – läuft **komplett offline** in einer einzigen HTML-Datei, ideal auf dem **iPad**.

## Öffnen
- Datei `index.html` im Browser öffnen (Safari/Chrome).
- Auf dem iPad: „Zum Home-Bildschirm hinzufügen" → startet wie eine App im Vollbild.
- Nichts zu installieren, keine Internetverbindung nötig.

## Bedienung
- **Antippen** der Textfläche = Start / Pause.
- **▶ Start** startet mit 3-2-1-Countdown.
- 🐢 / 🐇 = langsamer / schneller · **A− / A+** = Schriftgröße.
- 🔑 = Stichwort-Modus (Leitfaden) · 🔊 = Vorlesen an/aus · 🎯 Fokus-Modus · ⛶ Vollbild · ⚙️ Einstellungen.
- Ziehen (nach oben/unten) auf der Textfläche = manuell an die richtige Stelle scrollen (im normalen Modus).

### Tastatur (mit Bluetooth-Tastatur am iPad)
`Leertaste` Start/Pause · `↑`/`↓` Tempo · `←`/`→` springen · `R` Anfang · `F` Vollbild · `+`/`−` Schrift.

## Highlights

### 🔑 Stichwort-Modus (Leitfaden)
- 🔑 antippen schaltet vom Fließtext auf einen **Karten-Leitfaden** um: pro Abschnitt nur die **Schlüsselwörter** – du sprichst frei statt abzulesen.
- Die Stichwörter werden **automatisch** aus deinem Text gezogen (deutsche Nomen/Kernbegriffe), plus eine klare Überschrift je Karte (z. B. „1. Grund", „Kernbotschaft").
- Bedienung: **tippen** (rechts = weiter, links = zurück), **wischen**, Pfeil-Buttons oder Tastatur `←`/`→`. Fortschritts-Punkte zeigen, wo du bist.
- Pro Karte: **👁️ Volltext** (zur Sicherheit einblenden) und **🔊 Anhören** (Abschnitt vorlesen lassen).
- Direkt im Leitfaden starten: Link mit `#leitfaden` am Ende öffnen.

### 🔊 Vorlesen (Sprachausgabe)
- 🔊 antippen (oder in den Einstellungen „Text vorlesen") aktiviert die Sprachausgabe.
- Beim Start wird der Text **Satz für Satz vorgelesen**, und der Fokus/das Lese-Lineal springt automatisch auf den gerade gesprochenen Satz – ideal zum Mitlesen.
- Die **Stimme** ist wählbar (deutsche Stimmen zuerst); das **Tempo (WpM)** steuert auch die Vorlese-Geschwindigkeit.
- Nutzt die Sprachausgabe des Geräts – auf dem iPad direkt in Safari, ohne Zusatz-App.

### 📑 Mehrere Skripte
- Beliebig viele Skripte anlegen, benennen, kopieren, löschen und **umschalten** (Einstellungen → Skripte).
- Der aktive Skript-Name steht oben links; alle Skripte werden lokal gespeichert.

### 🎙️ Atempausen & Absatz-Pausen
- „Atempause zwischen Absätzen" (0–6 Sek.) einstellen: Bei jeder neuen Passage pausiert der Prompter kurz mit einer **Atem-Animation** zum Durchatmen.
- Manuelle Pause an beliebiger Stelle: eine Zeile mit nur `[pause]` oder `///` in den Text einfügen.

## Weitere ADHS- & Legasthenie-Hilfen
- **Bionic Reading** – Wortanfänge fett, die Augen finden schneller Halt.
- **Fokus-Modus** – alles außer der aktuellen Zeile wird gedimmt.
- **Lese-Lineal** – leuchtendes Band markiert die aktive Zeile.
- **Leseschrift** + einstellbarer Zeilen-, Buchstaben- und Wortabstand.
- **Hintergründe**: Dunkel, Warm, Creme (blendfrei), Hoher Kontrast.
- **Dopamin-Boosts**: Fortschrittsbalken, Meilenstein-Jubel (25/50/75 %) und Konfetti am Ende.
- **Tempo (WpM)** frei anpassbar – auch während des Sprechens – mit Live-Restzeit-Anzeige.
- **Spiegeln** für Teleprompter-Rigs mit Glasscheibe.

## Speichern
Text und alle Einstellungen werden lokal im Browser gespeichert (`localStorage`) – beim nächsten Öffnen ist alles wieder da.
