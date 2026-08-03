# SOULINK — Director Operating System

> Ein Betriebssystem für visuelles Storytelling auf dem iPad.
> **Keine Zufallsbilder. Regie-Intelligenz.**

SOULINK ist kein Bildgenerator mit hübscher Oberfläche. Es ist ein
Regie-System: Es denkt in Szenen, Spannungsbögen, Subtext und Filmsprache —
und erzeugt Bilder erst als *letzten* Schritt einer begründeten Entscheidungskette.

## Die vier Grundprinzipien (verbindlich, architektonisch erzwungen)

| Prinzip | Architektonische Durchsetzung |
|---|---|
| **Jedes Panel hat genau eine Aufgabe.** | `Panel` besitzt genau ein `narrativeJob` — Pflichtfeld, nicht optional. Zwei Aufgaben ⇒ Validierungsfehler „Panel überladen“, Vorschlag: Split. |
| **Jede Kamera verfolgt einen erzählerischen Zweck.** | `ShotSpec` referenziert eine `CameraMotivation` aus der Film-Grammar-KB. Kein freies Kamera-Feld ohne Motivation. |
| **Jede Fortsetzung ist dramaturgisch begründet.** | `Continuation` trägt einen typisierten `ContinuationLogic`-Wert (Eskalation, Enthüllung, Umkehr …) — kein „mehr vom Gleichen“. |
| **Jede Entscheidung braucht ein klares Warum.** | `DirectorRationale` ist Pflichtbestandteil jedes generierten Artefakts. Ein `RenderRequest` **kann ohne Rationale nicht konstruiert werden** (Typ-Invariante). |

## Status

**Phase A — Architektur.** Es existiert bewusst noch kein Produktcode.
Zuerst steht die vollständige, professionell begründete Architektur.

## Dokumente

| # | Dokument | Inhalt |
|---|---|---|
| 01 | [PRD](docs/01-PRD.md) | Vision, Nutzer, Jobs-to-be-done, Scope, Non-Goals, Erfolgsmetriken |
| 02 | [Systemarchitektur](docs/02-SYSTEM-ARCHITECTURE.md) | Schichten, Module, Director-IR-Compiler, Austauschbarkeit der Modelle |
| 03 | [Datenmodelle](docs/03-DATA-MODEL.md) | Entitäten, Schemata, Memory Graph, Persistenz, Versionierung |
| 04 | [UX & Interaktion](docs/04-UX-DESIGN.md) | iPad-Layout, Modi, Pencil, Flows, „Warum“-Panel |
| 05 | [Agentenstruktur](docs/05-AGENTS.md) | Rollen, Verträge, Orchestrierung, Veto-Rechte, Kritik-Schleife |
| 06 | [Referenzbild-Pipeline](docs/06-REFERENCE-IMAGE-PIPELINE.md) | Analyse → Fortsetzungen → Prompts → Übergänge |
| 07 | [Roadmap](docs/07-ROADMAP.md) | Phasen M0–M6, Definition of Done, Risiken |
| 08 | [Architekturentscheidungen](docs/08-DECISIONS.md) | ADR-001 … ADR-012, jede mit Begründung und Alternativen |
| 09 | [Filmsprache-Wissensbasis](docs/09-FILM-GRAMMAR.md) | Kamera-/Schnitt-/Licht-Taxonomie als auditierbare Daten |
| 10 | [Qualität & Evaluation](docs/10-QUALITY-AND-EVAL.md) | Regie-Kritiker, Metriken, Reproduzierbarkeit, Testarten |

## Leseempfehlung

Für den schnellen Überblick: **01 → 02 → 06**.
Für Implementierung: **02 → 03 → 05 → 09**.
Für Design: **04 → 06**.
