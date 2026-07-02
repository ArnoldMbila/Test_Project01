# Arcade der Heiligen Schrift – Web-Version (Three.js)

Browser-spielbare 3D-Arcade-Lernapp – **sofort auf dem iPad spielbar, ohne
Installation und ohne Build-Schritt**. Reines HTML/CSS/JavaScript (ES-Module).
Three.js liegt lokal unter `src/vendor/` (MIT-Lizenz) – **kein CDN, keine
Import Map** (die erst ab iOS 16.4 unterstützt wird), daher läuft die App auch
auf älteren iPads und komplett offline nach dem ersten Laden. Gleiche Inhalte
und Systeme wie die Unity-Version im Repo-Root: 80 Fragen, XP/Level, Münzen,
Streaks, 8 Mini-Games, persistenter Fortschritt. Keine externen Bezahl-Assets;
alle Sounds werden per WebAudio synthetisiert, alle 3D-Objekte sind Primitives
mit Canvas-Text-Labels.

## Sofort starten

**Option A – lokal (Mac/PC):**

```bash
cd web-playable
npm start        # startet npx serve auf http://localhost:3000
```

Oder jeder andere statische Server (`python3 -m http.server`, VS Code Live
Server …). Wichtig: über **http(s)** öffnen, nicht per `file://` –
ES-Module und `fetch` brauchen einen Webserver.

**Option B – GitHub Pages (perfekt fürs iPad):**

1. GitHub → Repo → *Settings* → *Pages* → Source: *Deploy from a branch*,
   Branch auswählen, Ordner `/ (root)`.
2. Nach dem Deploy im iPad-Safari öffnen:
   `https://<user>.github.io/<repo>/web-playable/`

**Option C – Vercel / Netlify:**

- Repo importieren, als *Root Directory* `web-playable` setzen,
  Framework „Other“, kein Build-Command, Output-Directory `.` – fertig.

Es gibt keine externen Abhängigkeiten zur Laufzeit – Three.js ist Teil des
Repos. Alle Pfade sind relativ, die App funktioniert daher auch unter
Unterpfaden wie `…github.io/<repo>/web-playable/`.

## Steuerung (Touch & Maus)

- Überall: **Tippen/Klicken** auf 3D-Blöcke und Buttons.
- Wortlauf (Runner): **linke/rechte Bildschirmhälfte halten** zum Steuern
  (Desktop zusätzlich Pfeiltasten / A,D).

## Die 8 Mini-Games

| Spiel | Mechanik | Fragetyp |
|---|---|---|
| Wortlauf | Runner – durch das richtige Tor laufen | Multiple Choice |
| Gleichnis-Paare | Begriff ↔ Bedeutung tippen | Matching |
| Wächter des Wissens | Boss schrumpft pro richtiger Antwort, 3 Herzen | Multiple Choice |
| Brücke der Zeitalter | Steine in richtiger Reihenfolge → Brücke wächst | Ordering |
| Karten der Weisheit | Antwort-Karte ausspielen, Duell-Marker | Multiple Choice |
| Takt der Wahrheit | Puls-Ring; Antwort im Takt = Bonus-XP | Multiple Choice |
| Lauf der Boten | Rennen gegen Rivalen, Boost bei richtiger Antwort | Multiple Choice |
| Stadt des Lichts | Münzen + Bauprüfung → Stadt wächst dauerhaft | Multiple Choice |

## Systeme (Spiegel der Unity-Architektur)

```
index.html          – Canvas + DOM-HUD (Touch-freundliche Overlays)
src/style.css       – Mobile-first UI, Safe-Area-Insets fürs iPad
src/main.js         – Boot, Spielhallen-Menü, Spiel-Lifecycle
src/core/state.js   – Profil, XP/Level/Münzen, Mastery, Tagesserie → localStorage
src/core/questions.js – JSON-Banks laden, Session-Auswahl (Mastery-gewichtet)
src/core/feedback.js  – EIN Eintrittspunkt pro Antwort: Sound + Popup + Belohnung
src/core/hud.js       – Stats-Leiste, Prompt, Feedback-Popup, Ergebnis-Modal
src/core/audio.js     – WebAudio-Synth-SFX (keine Audiodateien)
src/core/scene3d.js   – Three.js-Shell: Kamera, Licht, Picking, Label-Blöcke
src/games/base.js     – Session-Loop (Frage → Antwort → Feedback → nächste)
src/games/*.js        – die 8 Mini-Games
data/questions_*.json – die 80 Fragen (identisch mit der Unity-Version)
```

- **Belohnungsformeln identisch zur Unity-Version**: 10 XP pro richtiger
  Antwort, +5 pro Schwierigkeitsgrad, +5 Tempo-Bonus (< 5 s), Level =
  `1 + floor(sqrt(XP/100))`, 2 Münzen pro Treffer, +10 bei Mastery
  (3 richtige in Folge), Tagesserien-Bonus 5 Münzen/Tag (max. 50).
- **Fortschritt**: `localStorage` unter `bible-arcade-profile-v1`
  (Löschen = frisches Profil).
- **ADHS-freundlich**: 6 Fragen ≈ 3–4 Minuten pro Runde, Feedback im selben
  Frame, Fehler zeigen eine Erklärungs-Karte statt Strafe.

## Eigene Fragen hinzufügen

Neue JSON-Datei nach `data/` legen (Schema siehe vorhandene Dateien bzw.
Haupt-README) und den Dateinamen in `src/core/questions.js` →
`CATEGORY_FILES` eintragen. Die Kategorie erscheint automatisch im Menü.

## Tests

```bash
cd web-playable
npm test    # Node-Smoke-Test: Fragen-Validierung, Session-Auswahl,
            # XP/Level/Münzen/Mastery, Tagesserie, localStorage-Roundtrip
```

Zusätzlich wurden alle Module syntax- und import-geprüft und die
Auslieferung aller Pfade über einen statischen Server verifiziert.
Der WebGL-Teil braucht einen echten Browser → Checkliste in
[../Docs/TEST_CHECKLIST.md](../Docs/TEST_CHECKLIST.md) gilt analog.

## Browser-Kompatibilität & Fehlersuche

- Benötigt einen Browser mit ES-Modul-Unterstützung (Safari 11+, iPadOS 13+;
  empfohlen iPadOS 15+ für flüssiges WebGL). Keine Import Maps, kein
  `Promise.allSettled`, kein `inset`-CSS – bewusst vermieden für ältere Safaris.
- Tritt trotzdem ein Fehler auf, erscheint er als **rote Box am unteren
  Bildschirmrand** (globaler Error-Handler) – Text einfach weitergeben,
  das macht Ferndiagnose ohne Dev-Tools möglich.
- iOS gibt Audio erst nach der ersten Berührung frei (Standard-Verhalten).
- Querformat empfohlen; Hochformat funktioniert, zeigt aber weniger Spielfeld.
