# Claude 101 – Deutsche Lernversion 🧠✨

Eine **gehirn-/ADHS-freundliche, gamifizierte und visuell stimulierende** deutschsprachige
Lernversion zu den Themen aus Anthropics **Claude 101** Kurs – mit **Vorlese-Funktion**.
Alle **14 Lektionen** sind enthalten.

> Inoffizielle, eigenständige Lernhilfe zum Üben. Die Inhalte fassen die Kernthemen des
> Claude-101-Curriculums auf Deutsch zusammen und sind didaktisch für kurze, fokussierte
> Lerneinheiten aufbereitet.

## ▶️ Starten

Einfach **`index.html`** im Browser öffnen – kein Server, keine Installation nötig.
Der Fortschritt wird lokal im Browser (`localStorage`) gespeichert.

```
claude-101-de/
├── index.html   ← hier starten
├── style.css    ← Design (dunkel, vibrant, responsiv)
├── app.js       ← Logik: Gamification, Vorlesen, Fortschritt
├── lessons.js   ← Inhalte aller 14 Lektionen
└── README.md
```

## 🎯 ADHS-freundliches Design

- **Kleine Häppchen:** Jede Lektion ist in 4 kurze, fokussierte Karten zerlegt – immer nur *eine* Sache im Blick.
- **Klare nächste Aktion:** Ein großer „Weiter“-Button, keine Textwüsten.
- **Sofortiges Feedback:** XP-Pop-ups, Konfetti, Toasts – kleine Dopamin-Belohnungen.
- **Sichtbarer Fortschritt:** Schritt-Punkte, Prozentbalken, Level & Streak jederzeit sichtbar.
- **`🌙 Ruhe-Modus`:** Schaltet Animationen/Deko ab, wenn es zu viel Reiz ist.
- **`prefers-reduced-motion`** wird respektiert.

## 🎧 Vorlese-Funktion (Text-to-Speech)

- Jedes Häppchen und jede Quizfrage hat einen **🔊 Vorlesen**-Knopf.
- Nutzt die **Web Speech API** des Browsers mit **deutscher Stimme** (`de-DE`).
- **Tempo einstellbar** (🐢–🐇) und **⏹ Stopp**-Knopf.
- Tipp: In Chrome/Edge/Safari sind i. d. R. deutsche Stimmen vorinstalliert.

## 🎮 Gamification

- **XP** fürs Lesen (10), richtige Quizantworten (25) und Lektions-Abschluss (Bonus 50).
- **Level** alle 200 XP – mit Level-up-Konfetti.
- **8 Abzeichen** (🌱 Erste Schritte … 🏆 Claude-Profi, 🎧 Zuhörer:in, 📅 Streak …).
- **Tages-Streak** motiviert zum Dranbleiben.
- **Lernpfad** mit Freischaltung: Lektion N+1 öffnet nach Abschluss von N.

## 📚 Die 14 Lektionen

1. 👋 Willkommen bei Claude
2. 🧠 Was ist ein Sprachmodell?
3. 🚪 So erreichst du Claude
4. 💬 Dein erstes Gespräch
5. ✍️ Die Kunst des Promptens
6. 🎯 Prompt Engineering
7. 🪟 Das Kontextfenster
8. 📎 Dateien & Dokumente
9. 🗂️ Projects (Projekte)
10. 🎨 Artifacts
11. ⚙️ Claudes Modelle
12. 🛡️ Sicherheit & verantwortungsvolle KI
13. ⚠️ Grenzen & Halluzinationen
14. 🚀 Best Practices & nächste Schritte

## 🌐 Browser-Hinweise

- Getestet für aktuelle Chrome-, Edge-, Firefox- und Safari-Versionen.
- Die Vorlese-Funktion benötigt einen Browser mit Web-Speech-Unterstützung und
  eine installierte deutsche Stimme (sonst wird die Standardstimme verwendet).
