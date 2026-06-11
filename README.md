# Test_Project01 – Arcade der Heiligen Schrift

Eine modulare 3D-Arcade-Lernapp für Unity 6 (C#), die Bibelstudium-Fragen aus
PDF-Testbögen in kurze, ADHS-freundliche Mini-Game-Sessions verwandelt.
Alle Spielmechaniken, Namen und Inhalte sind Originalentwürfe für dieses
Projekt – keine geschützten Namen, Assets, Figuren oder kopierten Spieldesigns.

## Überblick

- **3 Fragenkataloge** (JSON, aus den PDF-Testbögen extrahiert):
  Grundstufe (Allgemeinwissen & Gleichnisse), Mittelstufe (Prophezeiung &
  Erfüllung), Oberstufe (Offenbarung) – zusammen 80 Fragen in 3 Formaten:
  Multiple Choice, Reihenfolge (Ordering), Zuordnung (Matching).
- **8 Original-Mini-Games** über eine gemeinsame Engine (`MiniGameBase`):

  | Spiel | Inspiration | Fragetyp |
  |---|---|---|
  | Wortlauf | Runner | Multiple Choice (durch das richtige Tor laufen) |
  | Gleichnis-Paare | Match | Matching (Begriff ↔ Bedeutung) |
  | Wächter des Wissens | Boss Battle | Multiple Choice (Boss-HP vs. Herzen) |
  | Brücke der Zeitalter | Order Puzzle | Ordering (Brücke Stein für Stein bauen) |
  | Karten der Weisheit | Card Duel | Multiple Choice (Antwort-Karte ausspielen) |
  | Takt der Wahrheit | Rhythm | Multiple Choice (im Takt = Bonus-XP) |
  | Lauf der Boten | Race | Multiple Choice (Boost bei richtiger Antwort) |
  | Stadt des Lichts | Kingdom Builder | Meta-Spiel: Münzen → Gebäude (persistent) |

- **Wiederverwendbare Kernsysteme** (ein `GameServices`-Singleton verdrahtet alles):
  `QuestionDatabase` (JSON-Laden, Session-Auswahl mit Mastery-Priorisierung),
  `ProgressionSystem` (XP, Level, Münzen, Mastery), `StreakSystem`
  (Session-Combo + Tagesserie mit Login-Bonus), `SaveSystem` (atomares
  JSON-Speichern), `FeedbackSystem` (Sofort-Feedback + Fehler-Erklärungen),
  `AudioManager` (SFX mit Synth-Fallback – läuft ohne Audio-Assets).

## ADHS-freundliches Lerndesign

- Kurze Sessions: 6 Fragen ≈ 3–4 Minuten, ein kompletter Belohnungszyklus.
- Feedback im selben Frame; richtige Antworten feiern kurz und gehen sofort weiter.
- Fehler bestrafen nicht: Sie zeigen eine kurze Erklärungs-Karte (Lernmoment).
- Externe Taktgeber (Rhythmus-Ring, Rennen) statt offener Zeitdrücke.
- Sichtbarer Langzeit-Fortschritt: XP/Level, Münzen, Tagesserie, wachsende Stadt.
- Leichte Spaced Repetition: nicht gemeisterte Fragen erscheinen bevorzugt;
  3 richtige Antworten in Folge = gemeistert (Bonus-Münzen).

## Setup (Unity 6)

1. **Unity 6 (6000.x) installieren** über den Unity Hub (Built-in Render
   Pipeline oder URP – die Platzhalter-Primitives funktionieren mit beiden).
2. Neues 3D-Projekt anlegen (oder ein bestehendes öffnen).
3. Die Ordner `Assets/Scripts` und `Assets/StreamingAssets` aus diesem Repo in
   den `Assets/`-Ordner des Projekts kopieren.
4. Neue leere Szene öffnen → leeres GameObject erstellen →
   **`ArcadeLauncher`**-Komponente hinzufügen (`Assets/Scripts/UI/ArcadeLauncher.cs`).
5. **Play drücken.** Menü, HUD, 3D-Szenen, Sounds und Speicherstand werden
   vollständig zur Laufzeit erzeugt – keine Prefabs, Materialien oder
   Audio-Dateien nötig.

Steuerung: Maus (Klicken) überall; im „Wortlauf“ zusätzlich A/D bzw. Pfeiltasten.

### Eigene Fragen hinzufügen

`Assets/StreamingAssets/Questions/*.json` – eine Datei pro Kategorie:

```json
{
  "categoryId": "meine_kategorie",
  "displayName": "Anzeigename",
  "questions": [
    { "id": "x_001", "type": "multipleChoice", "prompt": "Frage?",
      "options": ["richtig", "falsch1", "falsch2"], "correctIndex": 0,
      "explanation": "Warum das stimmt.", "reference": "Quelle", "difficulty": 1 },
    { "id": "x_002", "type": "ordering", "prompt": "Sortiere:",
      "orderedItems": ["erst", "dann", "zuletzt"], "explanation": "...", "difficulty": 2 },
    { "id": "x_003", "type": "matching", "prompt": "Ordne zu:",
      "pairs": [ { "left": "A", "right": "1" }, { "left": "B", "right": "2" } ],
      "explanation": "...", "difficulty": 2 }
  ]
}
```

Neue Dateien werden beim Start automatisch geladen; im `ArcadeLauncher` die
Kategorie-Buttons erweitern (Array `categories`), um sie anwählbar zu machen.

## Architektur

```
ArcadeLauncher (UI)            – Menü, Spielauswahl, Kategorie
   └── MiniGameBase (abstrakt) – Session-Loop: Frage → Antwort → Feedback → nächste
         ├── GateRunnerGame, PairMatchGame, BossBattleGame, OrderPuzzleGame,
         │   CardDuelGame, RhythmQuizGame, RelayRaceGame, KingdomBuilderGame
         └── nutzt SceneKit    – 3D-Platzhalter (Kamera, Licht, Blöcke, Labels)

GameServices (DontDestroyOnLoad-Singleton)
   ├── QuestionDatabase  ← StreamingAssets/Questions/*.json
   ├── SaveSystem        → persistentDataPath/player_profile.json (atomar)
   ├── ProgressionSystem – XP/Level/Münzen/Mastery (alle Belohnungsformeln)
   ├── StreakSystem      – Combo + Tagesserie
   ├── FeedbackSystem    – EIN Eintrittspunkt für alle Antworten (Report)
   └── AudioManager      – SFX/Musik, Synth-Fallback

HUDController – zur Laufzeit erzeugtes Canvas (XP, Münzen, Combo, Prompt,
                Feedback-Popup, Ergebnis-Panel)
```

Neue Mini-Games: von `MiniGameBase` ableiten, `SupportedTypes`,
`PresentQuestion` und `CleanupQuestion` implementieren, bei Antwort
`SubmitAnswer(bool)` aufrufen, im `ArcadeLauncher` registrieren. Belohnungen,
Streaks, Speichern und Feedback laufen automatisch.

## Weitere Doks

- [Docs/TEST_CHECKLIST.md](Docs/TEST_CHECKLIST.md) – manuelle QA-Checkliste
- [Docs/ROADMAP.md](Docs/ROADMAP.md) – Ausbaustufen

## Rechtliches / Inhalte

Spielmechaniken sind generische Genre-Konzepte in Originalumsetzung; alle
Namen, Texte und das visuelle Konzept wurden für dieses Projekt neu erstellt.
Die Lerninhalte stammen aus den vom Nutzer bereitgestellten Studienunterlagen.
