# 07 — Roadmap

**Leitregel für jede Phase:** Ein Meilenstein gilt erst als erreicht, wenn das
Ergebnis **begründet** ist — nicht, wenn es funktioniert. Ein Feature, das
Bilder liefert, aber sein Warum nicht belegen kann, ist in SOULINK unfertig.

---

## M0 — Architektur *(diese Lieferung)*

**Ergebnis:** PRD, Systemarchitektur, Datenmodelle, UX, Agentenstruktur,
Referenzbild-Pipeline, Filmsprache-Wissensbasis, Entscheidungen, Evaluation.

**Definition of Done**
- [x] Jedes Pflichtmodul hat eine klar abgegrenzte Verantwortung
- [x] Austauschbarkeit der Modelle ist strukturell verankert (IR + Adapter)
- [x] „Kein Bild ohne Begründung“ ist als Typinvariante formuliert
- [x] Jede Architekturentscheidung hat Alternative und Begründung (ADRs)

---

## M1 — Kernel & Gedächtnis *(≈ 3 Wochen)*

Das Fundament, ohne eine einzige Modellanbindung.

- `SoulinkKernel`: Domänentypen, `DirectorIR`, `DirectorRationale`, Validierung
- `SoulinkMemory`: SQLite/GRDB-Schema, Graph, zeitgültige Fakten, Migrationen
- Continuity Guard: Widerspruchssuche, Achsen-/Zeitprüfung, Veto-Objekte
- Decision-Log (append-only), Projekt-Paketformat `.soulink`

**DoD:** Ein Projekt lässt sich vollständig ohne KI anlegen; der Guard erkennt
einen eingebauten Widerspruch (Kostümzustand über Beat-Grenze) zuverlässig.
**Warum zuerst:** Das Gedächtnis ist der Wert, der bleibt, wenn Modelle
wechseln. Es zuletzt zu bauen, wäre die klassische Fehlreihenfolge.

---

## M2 — Filmsprache & Camera Intelligence *(≈ 3 Wochen)*

- Grammar-KB als versionierte YAML-Dateien (Regeln, Wirkungen, Constraints)
- Regelmaschine: Kandidatensuche, harte Filter, Bewertung, Rhythmuskontrast
- `ShotSpec`-Erzeugung **ohne LLM**, mit Begründungen aus Regelverweisen
- Grammatik-Tests: 40 Referenzfälle „Aufgabe → erwartete Kamerafamilie“

**DoD:** Für 40 Testfälle liefert das System begründete Shots; die Begründung
verweist ausschließlich auf existierende Regel-IDs (keine erfundenen Quellen).
**Warum ohne LLM:** Wenn die Regelbasis allein schon brauchbare Regie liefert,
ist das LLM später eine Verbesserung — und kein Krückstock.

---

## M3 — Prompt Composer & erster Adapter *(≈ 2 Wochen)*

- IR → Prompt, template- und dialektbasiert, vollständig testbar
- Zwei Dialektprofile + ein echter Bildadapter + ein `FakeAdapter` für CI
- Capability-Degradation, Kostenschätzung, Preflight, Seed-Protokollierung
- Reproduzierbarkeits-Test: gleiche Eingaben ⇒ byte-identischer Prompt

**DoD:** Modellwechsel per Konfiguration; Regie-Module bleiben unverändert
(CI-Test verbietet Import von `SoulinkAdapters` in L2–L4).

---

## M4 — Story Engine, Agenten & Assistant *(≈ 4 Wochen)*

- Dramaturg, Critic, Assistant mit strikten Ausgabeschemata
- Beat-Modell, Spannungskurve, Setup/Payoff-Verfolgung
- Konfliktrangordnung, Budgets, Revisionsgrenze, `openQuestions`-Fluss
- Schema-Validierung mit Rückfall auf die Regelbasis

**DoD:** Aus einer Prämisse entsteht eine Sequenz aus 8 Panels, jedes mit genau
einer Aufgabe, lückenloser Begründungskette und bestandener Continuity-Prüfung.

---

## M5 — iPad-App: Board, Spine, Inspector, Referenzmodus *(≈ 5 Wochen)*

- Drei-Zonen-Layout, vier Canvas-Modi, WARUM-Panel als feste Zone
- Referenzbild-Arbeitsplatz mit Overlays und korrigierbarer Analyse
- Pencil-Gesten → typisierte Constraints
- Drag & Drop, Stage Manager, Tastaturkürzel, VoiceOver, Dynamic Type
- Export: Shotliste (CSV/PDF), Prompt-Paket (JSON), Board (PDF)

**DoD:** Der Onboarding-Pfad aus [04 §8](04-UX-DESIGN.md) ist in unter zehn
Minuten durchlaufbar; Nutzertest mit fünf Personen aus P1/P2.

---

## M6 — Kritiker, Evaluation, Härtung *(≈ 3 Wochen)*

- Regie-Kritiker mit Bewertungsachsen und gerichteter Revisionsempfehlung
- Evaluations-Suite ([10](10-QUALITY-AND-EVAL.md)): Goldene Fälle,
  Continuity-Fallen, Rhythmus-Prüfungen, Reproduzierbarkeit
- Zweiter Bildadapter + lokaler CoreML-Adapter als Austauschbarkeitsbeweis
- C2PA-Metadaten, Kostenbudgets, Rechte-Preflight

**DoD:** Alle Erfolgsmetriken aus [01 §7](01-PRD.md) werden gemessen und
erreicht; Adapter Nummer drei wird in unter einem Tag integriert.

---

## Danach (bewusst nach v1)

Video-/Motion-Adapter · Kollaboration · teilbare Look Books ·
macOS-Version · Import bestehender Drehbücher (Fountain/FDX) ·
Lernmodus für Filmsprache (Persona P4 als eigenständiges Produkt).

---

## Risiken und Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| **Zu langsam für den Alltag** — Begründungspflicht kostet Zeit | Nutzer weichen aus | „Schnellskizze“: Regelbasis ohne LLM, Begründung knapp aber vorhanden; nie ganz abschaltbar |
| **Modelle ignorieren feine Kameravorgaben** | Regie wirkt folgenlos | Kritiker misst Abweichung; Dialektprofile lernen, welche Begriffe wirken; Degradation transparent |
| **Figurenkonsistenz bleibt schwach** | Kernversprechen verfehlt | Identitätsanker + adapterseitige Konsistenzfunktionen; früh im Kritiker messen (M6 → vorziehen falls rot) |
| **Belehrender Tonfall** | Produkt wirkt bevormundend | Konfliktrangordnung stellt Nutzer über Dramaturg; Widerspruch genau einmal |
| **Grammar-KB wird Dogma** | Ergebnisse werden generisch | `Strength`-Unterscheidung; Regelbruch ist eine eigene, motivierbare Option |
| **Kosten laufen davon** | Vertrauensverlust | Budget pro Projekt, Kostenanzeige vor Batch, Cache über `irHash` |
| **Anbieterausfall/Preisänderung** | Blockade | ≥ 2 Adapter ab M6, lokaler Adapter als Rückfall |
