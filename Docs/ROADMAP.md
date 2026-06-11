# Roadmap

## v0.1 – Spielbarer Kern (dieser Stand)
- 80 Fragen (3 Kataloge) als JSON, 3 Fragetypen
- 8 Mini-Games auf gemeinsamer Engine, komplett zur Laufzeit erzeugt
- XP/Level, Münzen, Combo- & Tagesserie, Mastery, atomares Speichern
- Sofort-Feedback mit Fehler-Erklärungen, Synth-Audio-Fallback

## v0.2 – Inhalt & Komfort
- Restliche PDF-Fragen importieren (Oberstufe 26–50 ergänzen, GS-Fragen 16+)
- PDF→JSON-Extraktionsskript (Python) ins Repo legen für neue Testbögen
- Bibelstellen-Anzeige als antippbare Referenzkarte in der Erklärung
- Einstellungen: Lautstärke, Schriftgröße, Farbschema (Kontrast/Dark)
- Lokalisierungs-Layer (DE zuerst, EN vorbereitet)

## v0.3 – Präsentation
- Platzhalter-Primitives durch Low-Poly-Modelle und Materialien ersetzen
- TextMeshPro statt Legacy-Text, gestaltete UI-Prefabs statt Code-Canvas
- Partikel-/Tween-Feedback (Konfetti bei Mastery, Screenshake beim Boss)
- Eigene Musik-Loops pro Spiel, Lautstärke-Ducking bei Erklärungen

## v0.4 – Lernsystem
- Echte Spaced Repetition (SM-2-light: Wiedervorlage-Intervalle pro Frage)
- Schwächen-Dashboard: Welche Themen/Kapitel brauchen Übung?
- Adaptiver Schwierigkeitsgrad (difficulty-Feld steuert Fragenmix)
- Tages-Quests („3 Ordering-Fragen richtig") mit Bonusbelohnung

## v0.5 – Mehr Spiel
- Stadt des Lichts: Produktions-Loop (Gebäude generieren Münzen über Zeit)
- Wöchentliche Boss-Herausforderung mit Bestenliste (lokal)
- 2-Spieler-Hotseat im Kartenduell
- Mobile Build (Touch-Steuerung ist durch Maus-Raycasts schon vorbereitet)

## Technische Schulden / bekannte Grenzen
- StreamingAssets-Loading nutzt File IO → für Android auf UnityWebRequest umstellen
- Legacy-Input (Input.GetAxis) → neues Input System, wenn Touch dazukommt
- HUD/Launcher-UI per Code ist bewusst minimal – beim Umstieg auf Prefabs nur
  die öffentlichen Methoden von HUDController stabil halten
- Unit-Tests: Reward-Formeln und Streak-Logik sind testbar (reine Methoden),
  Edit-Mode-Tests unter Assets/Tests ergänzen
