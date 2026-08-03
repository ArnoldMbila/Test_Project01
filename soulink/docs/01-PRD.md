# 01 — Product Requirements Document

**Produkt:** SOULINK — Director Operating System
**Plattform:** iPadOS (primär), macOS (Catalyst, später)
**Dokumentstatus:** Architekturphase, Version 1.0

---

## 1. Problem

Aktuelle generative Bildwerkzeuge produzieren **Einzelbilder**. Erzählen findet
im Kopf des Nutzers statt, nicht im Werkzeug. Konkret:

1. **Kein Gedächtnis.** Bild 7 weiß nichts von Bild 3. Figuren altern, Kostüme
   wechseln, Räume verändern ihre Geometrie.
2. **Keine Motivation.** Die Kamera ist eine Stilentscheidung („cinematic,
   35mm, dramatic lighting“), keine erzählerische. Der Prompt beschreibt
   *Aussehen*, nicht *Absicht*.
3. **Keine Dramaturgie.** Es gibt keinen Spannungsbogen, keinen Subtext, keine
   Setups und keine Payoffs — nur eine Reihe hübscher Frames.
4. **Zufall als Feature.** „Re-roll, bis es gefällt“ ist kein Regieprozess,
   sondern Glücksspiel. Es ist nicht reproduzierbar, nicht erklärbar, nicht
   verteidigbar gegenüber Auftraggeber, Team oder dem eigenen Anspruch.

**Die Kernthese von SOULINK:** Der Engpass ist nicht die Bildqualität der
Modelle. Der Engpass ist **Regie** — die Fähigkeit, zu begründen, *warum*
dieses Bild, aus dieser Distanz, in diesem Moment, nach jenem Bild.

---

## 2. Vision

> SOULINK ist die Instanz zwischen Idee und Bild, die wie ein Regisseur denkt:
> Sie kennt die Geschichte, erinnert sich an jedes Detail, beherrscht die
> Filmsprache — und begründet jede Entscheidung, bevor sie ein Modell überhaupt
> anfasst.

Das Modell ist ein **Objektiv**, kein Autor. Objektive tauscht man aus.
Die Regie bleibt.

---

## 3. Zielgruppen & Personas

### P1 — „Die Regisseurin“ (Kern-Persona)
Entwickelt eine Serie/Kurzfilm/Musikvideo. Braucht Previz, Moodboards,
Shotlisten und Pitch-Material, die dramaturgisch stimmen. Legt Wert darauf,
ihre Entscheidungen im Team verteidigen zu können.
*Erfolg =* Sie kann jedem Frame ansehen, welche Funktion er hat.

### P2 — „Der Comic-/Graphic-Novel-Autor“
Denkt in Panels und Seitenrhythmus. Braucht Figurenkonsistenz über hunderte
Panels und Kontrolle über Blickführung und Panelfolge.
*Erfolg =* Figur X sieht auf Seite 84 aus wie auf Seite 3, und die Panelfolge
liest sich rhythmisch.

### P3 — „Die Werbe-/Content-Regie“
Produziert unter Zeitdruck Varianten, die auf eine Kernaussage einzahlen.
Braucht schnelle, begründete Alternativen statt zufälliger Neuwürfe.
*Erfolg =* Drei Varianten mit je erklärbar unterschiedlicher Wirkung.

### P4 — „Der Studierende / Lernende der Filmsprache“
Nutzt SOULINK als Lehrmeister: Warum ist das ein Medium Shot? Was passiert,
wenn ich die Achse überschreite?
*Erfolg =* Er versteht nach 20 Sessions Filmsprache besser als vorher.

**Nicht-Zielgruppe:** Nutzer, die schnell ein einzelnes hübsches Bild wollen.
Für sie ist SOULINK bewusst zu langsam und zu meinungsstark.

---

## 4. Jobs-to-be-done

| ID | Job | Auslöser |
|---|---|---|
| J1 | „Ich habe eine Idee und brauche eine Sequenz, die erzählt.“ | Leeres Projekt |
| J2 | „Ich habe ein Bild und weiß nicht, wie es weitergeht.“ | Referenzbild-Import |
| J3 | „Meine Figur muss über 200 Bilder gleich aussehen.“ | Konsistenzbedarf |
| J4 | „Ich muss begründen, warum ich diesen Schnitt setze.“ | Review/Pitch |
| J5 | „Ich will die Wirkung einer Alternative sehen, nicht raten.“ | Varianten |
| J6 | „Ich will meine Shotliste exportieren.“ | Übergabe an Produktion |

---

## 5. Funktionsumfang

### 5.1 Pflichtmodule (vom Auftrag gesetzt)

| Modul | Aufgabe in einem Satz |
|---|---|
| **Director Engine** | Orchestriert alle Entscheidungen und erzwingt, dass keine ohne Begründung passiert. |
| **Story Engine** | Hält Prämisse, Figuren, Konflikt, Bogen, Beats, Subtext — die *Warum-Ebene* der Erzählung. |
| **Camera Intelligence** | Übersetzt erzählerische Funktion in Kamera-, Licht- und Kompositionsentscheidungen. |
| **Continuity & Memory Graph** | Das Langzeitgedächtnis: Wer, was, wo, womit, seit wann, im Widerspruch wozu. |
| **Prompt Composer** | Kompiliert die Regieentscheidung deterministisch in modellspezifische Prompts. |
| **Director Assistant** | Der Gesprächspartner: fragt nach, schlägt vor, widerspricht, erklärt. |

Detaillierte Verantwortlichkeiten: siehe [02 — Systemarchitektur](02-SYSTEM-ARCHITECTURE.md).

### 5.2 Kernfeatures (Priorisierung MoSCoW)

**MUST**
- Projekt-Bibel (Prämisse, Figuren, Orte, Regeln, Ton)
- Beat-Board mit Spannungskurve
- Shot-Erzeugung mit Pflicht-Rationale
- Referenzbild-Analyse → begründete Fortsetzungsoptionen → fertige Prompts + Übergänge
- Continuity-Prüfung mit Veto vor jeder Generierung
- Modell-Adapter-Schicht (mind. 2 Bildmodelle, 1 LLM austauschbar)
- „Warum“-Panel zu jedem Artefakt
- Offline-Arbeit an Struktur (ohne Netz kein Rendern, aber volle Regiearbeit)

**SHOULD**
- Sequenz-/Timeline-Modus mit Schnittrhythmus
- Graph-Ansicht des Memory Graph
- Regie-Kritiker (Bewertung Ergebnis vs. Absicht)
- Export: Shotliste (CSV/PDF), Prompt-Paket (JSON), Board (PDF)
- Apple-Pencil-Framing-Overlays

**COULD**
- Video-/Motion-Adapter (Bild → bewegter Shot)
- Kollaboration mehrerer Nutzer an einem Projekt
- Stil-Bibliotheken („Look Books“) als teilbare Pakete

**WON'T (v1)**
- Vollwertiger Videoschnitt / NLE-Ersatz
- Audio-, Musik-, Sounddesign
- Deepfake-/Likeness-Erzeugung realer Personen (siehe §8)

---

## 6. Nicht-Ziele (explizit)

1. **Kein Ein-Klick-Generator.** Wer nur ein Bild will, bekommt trotzdem eine
   Rückfrage nach der Absicht. Das ist Absicht, kein Defekt.
2. **Kein Modell-Lock-in.** SOULINK bewertet und bindet kein Modell fest.
3. **Kein Stilklau.** Keine Reproduktion lebender Künstler-Signaturstile auf
   Zuruf, keine Nachbildung geschützter Figuren.
4. **Kein Zufall als Antwort.** Wo das System nicht begründen kann, sagt es
   „ich weiß es nicht“ und stellt eine Frage — es würfelt nicht.

---

## 7. Erfolgsmetriken

| Metrik | Zielwert v1 | Warum diese Metrik |
|---|---|---|
| **Rationale-Abdeckung** | 100 % der Artefakte | Kernversprechen; unter 100 % ist das Produkt gebrochen |
| **Continuity-Verstöße pro 100 Shots** | < 2 | Misst das Gedächtnis, das Wettbewerber nicht haben |
| **Re-roll-Quote** | < 15 % | Hohe Quote = das System hat nicht verstanden, nicht das Modell versagt |
| **Reproduzierbarkeit** | 100 % identische ShotSpecs bei gleichem State+Seed | Regie muss wiederholbar sein |
| **„Warum“-Panel-Öffnungen / Session** | > 5 | Nutzer vertrauen der Begründung nur, wenn sie sie lesen |
| **Zeit bis zur ersten begründeten Sequenz** | < 10 min | Onboarding-Härtetest |
| **Modelltausch-Aufwand** | < 1 Tag pro neuem Adapter | Beweist die Austauschbarkeitspflicht |

---

## 8. Randbedingungen & Verantwortung

- **Plattform:** iPadOS 18+, Apple Pencil, Stage Manager, Magic Keyboard.
  Ziel-Gerät M-Serie; A-Serie mit reduzierter lokaler Inferenz.
- **Datenhoheit:** Projekt-Bibel und Memory Graph liegen lokal. Cloud-Sync ist
  opt-in (CloudKit, private Datenbank).
- **Personenrechte:** Keine Generierung erkennbarer realer Personen ohne
  hinterlegte Freigabe. Referenzbild-Analyse identifiziert keine realen
  Personen — sie beschreibt Rollen und Funktionen („die Figur im Mantel“).
- **Herkunft:** Jedes Ausgabebild trägt C2PA-Metadaten (KI-generiert, Modell,
  Zeitpunkt). Das ist Berufsethik, kein Feature-Beiwerk.
- **Kosten:** Generierungen kosten Geld. Das System zeigt vor jedem Batch die
  geschätzten Kosten und begründet, warum diese Variantenzahl nötig ist.

---

## 9. Warum das verteidigbar ist

Der Wettbewerb optimiert **Bildqualität** — eine Kurve, die sich abflacht und
von den Modellanbietern selbst getrieben wird. SOULINK optimiert
**Entscheidungsqualität**. Der Wert liegt im Memory Graph, in der
Filmsprache-Wissensbasis und in der Nachvollziehbarkeit — Dinge, die mit jedem
Projekt des Nutzers wachsen und beim Modellwechsel *nicht verloren gehen*.

Deshalb ist die Modell-Adapter-Schicht (ADR-003) kein technisches Detail,
sondern das Geschäftsmodell.
