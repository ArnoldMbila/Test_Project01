# APOKALYPSIS CRISIS – Offenbarung 1–22 als Lernspiel

Ein Browser-Lernspiel im Missions-Stil von *Final Fantasy VII Ever Crisis*
(nur **inspiriert** – komplett eigener Code, eigene Namen, keine Assets,
Figuren oder Inhalte von Square Enix), mit dem du den Inhalt der
**Offenbarung, Kapitel 1–22** auswendig lernst.

**Bibeltext:** unrevidierte **Elberfelder Übersetzung von 1905** (gemeinfrei).
Die revidierte Elberfelder ist urheberrechtlich geschützt und wird bewusst
nicht verwendet – die 1905er Fassung ist ihr sprachlich sehr nahe.

## Sofort spielen

`index.html` im Browser öffnen – fertig. Kein Build, kein Server nötig
(auch auf dem iPad). Beim ersten Start lädt die App den Bibeltext einmalig
von der freien [getbible-API](https://getbible.net) und speichert ihn
dauerhaft im Browser (localStorage). Das ~130-Fragen-Quiz funktioniert
auch komplett offline.

### Bibeltext fest einbetten (optional, für 100 % offline)

```bash
node tools/fetch_bibeltext.mjs
```

erzeugt `data/bibeltext.js` – danach brauchen auch Lese-, Lückentext- und
Puzzle-Modus nie wieder Internet.

## Spielmodi (pro Kapitel = eine „Mission“)

| Modus | Lernziel |
|---|---|
| 📖 **Kapitel lesen** | Ganzer Kapiteltext (Elberfelder 1905), Schlüsselverse golden markiert |
| ⚔️ **Quiz-Kampf** | 5–8 inhaltliche Fragen; richtige Antwort = Angriff auf den Gegner |
| 🧩 **Vers-Training** | Lückentext: das fehlende Wort im Vers erkennen |
| 🔀 **Vers-Puzzle** | Vers-Abschnitte in die richtige Reihenfolge bringen |
| 👑 **Boss-Kampf** | Gemischte Prüfung; Sieg schaltet das nächste Kapitel frei |
| 🗡️ **Tägliches Training** | Falsch beantwortete Fragen kommen wieder (leichte Spaced Repetition) + Tagesserie |

## Spielsysteme (FF7-EC-inspiriert)

- **ATB-Bonus:** je schneller die richtige Antwort, desto mehr Schaden.
- **Combo & Limit:** richtige Antworten in Serie laden die Limit-Leiste –
  bei 100 % macht der nächste Treffer doppelten Schaden.
- **EXP / Level / Manna:** dauerhafter Fortschritt, Tagesserien-Bonus.
- **Sterne (★★★)** pro Kapitel je nach Quiz-Trefferquote.
- **Kein Zeitdruck-Zwang:** Der ATB-Timer gibt nur Bonus, bestraft nie –
  Fehler zeigen stattdessen eine „Merke“-Karte mit Versangabe (Lernmoment).

Der Spielstand liegt im `localStorage` des Browsers
(`apokalypsis_crisis_save_v1`).

## Entwicklung

```bash
node tools/validate_questions.mjs   # Fragen-Datenbank prüfen
```

Struktur:

```
index.html            Einstieg (kein Build nötig)
style.css             FF-Menü-Look (Original-CSS)
data/questions.js     22 Kapitel, ~130 eigene Quizfragen mit Versangaben
data/bibeltext.js     (optional, generiert) eingebetteter Bibeltext
src/app.js            Spiellogik: Screens, Kampf-Engine, Fortschritt
tools/                Fetch- und Validierungs-Skripte
```
