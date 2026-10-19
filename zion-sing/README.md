# 🎤 Zion Sing – Singen lernen mit den Liedern der Offenbarung

Eine Gesangs-Lern-App nach dem Vorbild von **Simply Sing**: Du singst zu echten
Songs, siehst in Echtzeit, ob du die Töne triffst, und bekommst Punkte, Sterne
und gezielte Übungen. Inhalt sind deine Afro-Songs zur Offenbarung (Elberfelder)
und alle 405 Verse aus „Zion-Arcade Offenbarung – Alle Verse“.

Reines HTML/CSS/JavaScript, keine Abhängigkeiten, läuft offline auf iPad, Handy und Desktop.

## Starten

```bash
cd zion-sing
npm start            # → http://localhost:8080
# oder: python3 -m http.server 8080
```

> ⚠️ Mikrofon und Web-Audio funktionieren nur über `http://localhost` oder
> `https://` – **nicht** per Doppelklick auf `index.html` (`file://`).
> Für das iPad: Ordner auf GitHub Pages / Netlify / Vercel hochladen, in Safari
> öffnen, „Zum Home-Bildschirm“ → läuft danach als App, auch offline.

🎧 Kopfhörer empfohlen – dann hört das Mikrofon nur deine Stimme.

## Funktionen (Simply-Sing-Funktionsumfang)

| Simply Sing | Zion Sing |
|---|---|
| Song-Bibliothek, Sammlungen nach Genre/Stimmung | 3 Songs (Offb 2,12-29 · 8,7-13 · 13,10-18) + eigene Songs + alle 22 Kapitel, Filter nach Genre/Stimmung, Volltextsuche über Songs & 405 Verse |
| Song-Stufen Basic → Easy → Medium → Hard → Extreme | jede Stufe macht den Song schwerer (länger, strengere Bewertung, leisere Leitstimme, Text-Lücken bis auswendig); 2 Sterne schalten die nächste frei |
| Echtzeit-Tonhöhen-Feedback | Notenbahn: Ziel-Noten laufen zur Spiellinie, deine Stimme als leuchtende Spur; „Perfekt!/Super!/Gut!“, „↑ höher / ↓ tiefer“, Combo-Zähler |
| Karaoke-Lyrics | Wort-für-Wort-Füllung, nächste Zeile als Vorschau, Vers-Anzeige, Instrumental-Hinweis |
| Stimmumfang-Test | 3 Schritte wie im Original: sprechen (bequeme Lage) → tief summen → hoch rufen/singen → Stimmlage (Bass … Sopran), Klaviatur-Anzeige |
| Songs passen sich deiner Stimme an | „Auto“-Tonart: Oktave + Halbtöne so verschoben, dass der Song in deinen Umfang passt (echte Transposition per AudioWorklet), manuell −5…+5 |
| Leitstimme an/aus | Gesang und Instrumental sind getrennte Spuren → Leitstimme stufenlos 0–100 % |
| Üben / Abschnitte | jeder Vers einzeln in Dauerschleife, 60–100 % Tempo (tonhöhenerhaltend), „Zeile wiederholen“, „5 s zurück“, Intro überspringen |
| Schwierigkeitsstufen | Leicht (±2 HT, Oktave egal) · Mittel (±1 HT) · Profi (±½ HT, exakte Oktave) |
| Ergebnis & Sterne | Punkte 0–100, 1–3 Sterne, Noten getroffen, beste Combo, Zeile-für-Zeile-Heatmap → Tippen übt genau diese Zeile, „Schwache Stelle üben“ |
| Aufnahme-Studio | Studio-Modus: Song zum Playback singen (ohne Notenbahn/Leitstimme, ● REC), Aufnahmen (Stimme + Musik, latenzkorrigiert) gespeichert, anhören, herunterladen, löschen |
| Tägliches Warm-up & Tipps | 5-Minuten-Warm-up (Atem, Tonhöhe, Selbstvertrauen) mit Tages-Haken + Tipp des Tages |
| Lektionen & Warm-ups | Kurs mit 4 Einheiten / 12 Lektionen (Atem, Töne treffen, Leiter, Arpeggio, Intervalle, Sirene, Höhe, Tiefe, Oktave, Song-Phrasen) + 6 Warm-ups; Prinzip „👂 hören → 🎤 nachsingen“, Tipps mit Vorlesefunktion |
| Fortschritt | XP & Level, Tagesserie, Tagesziel-Ring, Wochen-Diagramm, Verlauf, Bestwerte, 12 Erfolge |
| Extras | Stimmgerät (Note, Cent-Nadel, Referenztöne), Lyrics-Lernmodus („Lern-Modus“/„Auswendig“ blenden Wörter aus, bis sie gesungen werden), Kapitel-Lesemodus mit Ausblenden, Vers des Tages, Latenz-Klatsch-Test, Notennamen C-D-E-H / B / Do-Re-Mi |

### Eigene Songs importieren
`Songs → ＋ Import`: Audiodatei wählen, Text einfügen (oder Verse aus der
Offenbarung übernehmen) → die App schätzt die Melodie direkt im Browser (YIN) →
Zeilen-Timing per **TAP** im Takt mittippen (oder automatisch verteilen).
Leitstimme regelt hier zwischen Original und Karaoke-Filter (Mitten-Auslöschung).
Alles wird nur lokal (IndexedDB) gespeichert.

## Design

Gestaltet nach den App-Screen-Regeln des [Taste Skill](https://github.com/Leonxlnx/taste-skill)
(Stil „True-black flat“): echtes Schwarz, Ebenen nur durch Helligkeit (#000 → #111 → #2a2a2a),
keine Rahmen, Schatten, Verläufe oder Emoji. Eine einzige Datenfarbe – Gold, wie die goldenen
Leuchter – nur auf deiner Stimme, getroffenen Noten, Sternen und Fortschritt. Primäre Aktionen
als weiße Pille. Schrift: Inter (lokal eingebettet, funktioniert offline). Desktop mit
Seitenleiste, Handy mit Leiste unten. Geprüft mit `lint.mjs --app` (0 FAIL) und `inspect.mjs --app`
(0 FAIL auf allen messbaren Seiten bei 1440/768/390 px).

## Wie die Song-Daten entstanden sind (`tools/`)

1. **Gesang trennen** – `separate_vocals.py` (UVR-MDX-NET-Voc_FT, ONNX):
   Original-MP3 → Gesangsspur. `make_tracks.py`: Instrumental = Original − Gesang.
2. **Melodie** – `extract_melody.py` (pYIN auf der Gesangsspur) → Noten `[start, dauer, midi]`.
3. **Timing** – Wort-Zeitstempel der Gesangsspur per Spracherkennung
   (`tools/transcripts/*.words.json`).
4. **Ausrichten** – `build_songs.py` legt die Zeitstempel auf den *originalen*
   Elberfelder-Text (Sequenz-Alignment), Ad-libs („Oh-oh-oh“, Wiederholungen)
   werden eigene Zeilen → `data/songs.js`, `data/offenbarung.js`.

```bash
pip install librosa onnxruntime soundfile
python tools/separate_vocals.py UVR-MDX-NET-Voc_FT.onnx song.mp3 vocals.wav
python tools/extract_melody.py vocals.wav tools/transcripts/<id>.pitch.json
python tools/make_tracks.py <id> song.mp3 vocals.wav
python tools/build_songs.py
```

## Tests

```bash
npm test                                   # Unit-Tests (Tonhöhe, Bewertung, Daten: Text = Elberfelder wortgenau)
npm i --no-save playwright-core && node test/e2e.mjs   # Browser-Test mit simuliertem Sänger
```

## Aufbau

```
index.html, style.css, sw.js (Offline), manifest.webmanifest, server.mjs
data/        songs.js (Lyrics, Noten), offenbarung.js (405 Verse)
audio/       <song>_inst.mp3, <song>_vocals.mp3, Cover
src/audio/   yin.js (Tonhöhe), engine.js (Mikro), player.js (Spuren, Tempo, Transposition),
             synth.js, recorder.js, analyze.js (Import-Analyse)
src/core/    notes.js, scoring.js, store.js, catalog.js, lessons.js, stages.js
src/ui/      lane.js (Notenbahn), lyrics.js (Karaoke), dom.js
src/screens/ home, library, song, session, results, range, train, tuner, profile, import, studio
```

„Simply Sing“ ist eine Marke von Simply Ltd. Zion Sing ist ein unabhängiger
Nachbau des Funktionsprinzips mit eigenem Code, Design und Inhalten.
