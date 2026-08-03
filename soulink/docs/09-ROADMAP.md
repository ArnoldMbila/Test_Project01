# 09 — Roadmap

> Reihenfolgeprinzip: **Verträge vor Modulen, ein vertikaler Schnitt vor Breite,
> Determinismus vor Modellen.** Was das Produkt ausmacht (begründete Fortsetzung),
> wird als Erstes vollständig gebaut — nicht als Letztes.

---

## Überblick

| Phase | Titel | Kern | Dauer (Schätzung, 1 Team) |
|---|---|---|---|
| **P0** | Fundament & Verträge | Domäne, Ledger, Rationale Gate, Gateway-Protokolle — **kein UI** | 3–4 Wochen |
| **P1** | Vertikaler Schnitt: Referenz → Fortsetzung | Das Flaggschiff, Ende zu Ende, minimales UI | 5–6 Wochen |
| **P2** | Story Engine & Board | Struktur, Beats, Spannungskurve, Board-Modus | 4–5 Wochen |
| **P3** | Camera Intelligence vollständig | Achse, Anschluss, Coverage, Grundriss-Modus | 5–6 Wochen |
| **P4** | Continuity & Memory Graph vollständig | Zeitachse, Audit, Anker-Scoring, Post-Check | 4–5 Wochen |
| **P5** | Mehrmodell, Bewegung, Export | Zweiter/dritter Adapter, Übergänge, PDF/Shotlist | 4 Wochen |
| **P6** | Assistant-Tiefe & Zusammenarbeit | Sokratik, Kritik, Lehrmodus, Teilen | 5 Wochen |

Gesamt bis produktreifer Kern (P0–P4): **~5–6 Monate**.

---

## P0 — Fundament & Verträge

**Ziel:** Die Doktrin ist Code, bevor irgendetwas sichtbar ist.

**Umfang**
- Domänentypen: `Panel`, `PanelJob`, `Beat`, `CameraSetup`, `CameraIntent`, `Rationale`,
  `Decision`, `ContinuationOption`, `PromptIR`
- Director Engine als Actor: `submit`, `state`, `explain`, Ledger mit Snapshots
- Rationale Gate mit allen drei Prüfungen + Negativkorpus
- Regelkorpus-Loader (YAML → Regelmodelle), Version im `Ground`
- Model-Gateway-Protokolle, `ModelDescriptor`, `PromptRenderer`-Vertrag (noch ohne Adapter)
- JSON-Schemata für die drei Kernverträge
- Testinfrastruktur: Invarianten-Tests I1–I6, Fixtures-Gerüst

**Exit-Kriterien**
- [ ] Alle sechs Invarianten-Tests grün — insbesondere: `CameraSetup` ohne Intent ist nicht konstruierbar
- [ ] `explain()` liefert eine mehrstufige Begründungskette auf Testdaten
- [ ] Ledger-Wiedergabe reproduziert Zustand deterministisch (1000 Entscheidungen, 100 Läufe)
- [ ] Rationale Gate lehnt 200/200 Floskeln ab, akzeptiert 50/50 gute Begründungen
- [ ] Lint verbietet Modellnamen in `SoulinkDomain`; Build bricht bei Verstoß ab

**Risiken:** Overengineering des Ledgers. *Gegenmaßnahme:* Snapshots erst, wenn ein
Benchmark sie erzwingt — nicht vorab.

---

## P1 — Vertikaler Schnitt: Referenz → Fortsetzung

**Ziel:** Ein Nutzer legt ein Bild ab und bekommt drei begründete, strategisch verschiedene
Fortsetzungen mit fertigen Prompts. Das ist der Beweis der Produktthese.

**Umfang**
- ReferenceAnalyst: alle sieben Stufen, parallel/sequenziell wie in [05](05-AGENTEN.md) §4
- Spannungsvektor-Extraktion
- **Archetyp-Planer (deterministisch)** — das Herzstück
- ContinuationArchitect, ein Aufruf je Archetyp
- Diversitätsprüfung + Nachsynthese
- Prompt Composer → PromptIR → ein Renderer, ein Bildmodell
- Minimal-UI: Referenz-Modus, Analysestufen-Karten, Fortsetzungskarten, Inspector
- Übernahme-Transaktion (erzeugt Panel + Kamera + Kontinuitätsupdate)

**Exit-Kriterien**
- [ ] Referenzbild → Optionsset in < 25 s, erste Stufe sichtbar < 3 s
- [ ] Strategiedistanz ≥ 0,6 auf dem Eval-Set (30 Bilder)
- [ ] 5 Regisseure bewerten: ≥ 3 von 5 Optionen „ernsthaft erwägenswert"
- [ ] Jede Option besteht das Rationale Gate ohne manuelle Nachhilfe
- [ ] Übernahme erzeugt ein vollständiges, valides Panel; Teilausfall rollt zurück
- [ ] Ehrlicher Teilausfall funktioniert: bei 2 tragfähigen Archetypen erscheinen 2 Optionen mit Begründung

**Risiken:** Optionen kollabieren trotz Archetyp-Fächerung. *Gegenmaßnahme:* Der Planer gibt
zusätzlich die Kamerarelation vor und der Prompt enthält die Abgrenzungsklausel
(„Du darfst die Strategie nicht wechseln"). Wenn das nicht reicht, wird die abgelehnte
Nachbaroption in den Prompt als Negativbeispiel gereicht.

---

## P2 — Story Engine & Board

**Ziel:** Fortsetzungen stehen nicht mehr allein, sondern in einer Struktur mit Bogen.

**Umfang**
- Story Spine, Szenen, Beats mit Wertwechsel, Subtext, Stakes
- Spannungskurve + Diagnostik (Plateau, Sägezahn, fehlender Tiefpunkt, vorzeitiger Gipfel)
- Strukturvorlagen als Daten (Drei-Akt, Sequenzmodell, Kishōtenketsu)
- Board-Modus mit Panelkarten (Aufgabe, Kamera-Kurzformel, Übergang, Befunde)
- Story-Modus mit Beat-Karten
- Permanente Spannungskurve unten
- StoryAnalyst-Agent

**Exit-Kriterien**
- [ ] Diagnostik erkennt alle Kurvenfixtures korrekt, Falsch-Positiv-Rate ≤ 5 %
- [ ] Beat ohne Wertwechsel wird als `inertBeat` markiert und vom Assistant angesprochen
- [ ] Board scrollt mit 200 Panels ohne Frame-Drop
- [ ] Fortsetzungsoptionen berücksichtigen nachweislich den Beat-Kontext (A/B gegen P1)

---

## P3 — Camera Intelligence vollständig

**Ziel:** Kamera wird von „begründeter Vorschlag" zu „geprüfter Grammatik über Folgen".

**Umfang**
- Vollständiger `shot-grammar`-Korpus mit Quellen und Kontraindikationen
- Achsenmodell inkl. erlaubter Wechsel (neutrale Einstellung, Fahrt, Figurenbewegung)
- Anschlussprüfungen: 180°, 30°, Größensprung, Screen Direction, Eyeline, Lens Jump
- Bewegungsmotivation als Pflichtfeld, durchgesetzt
- `intentionalViolation`-Fluss („bewusst so")
- **Grundriss-Modus** mit Pencil, Live-Achsenfeedback während der Geste
- Coverage-Planung mit Lückenmeldung
- CameraDramaturg-Agent

**Exit-Kriterien**
- [ ] Alle Grammatikfixtures korrekt bewertet; Falsch-Positiv-Rate ≤ 5 %
- [ ] Achsenprüfung läuft in < 5 ms → Live-Feedback während des Ziehens
- [ ] Coverage-Vorschlag für eine Dialogszene entspricht der Expertenlösung in ≥ 70 % der Einstellungen
- [ ] „Bewusst so" erzeugt eine begründete Ausnahme, die dauerhaft sichtbar bleibt

**Risiken:** Der Regelkorpus wird zu dogmatisch und nervt. *Gegenmaßnahme:* Die
„bewusst so"-Quote je Regel wird gemessen ([08](08-QUALITAET-NFR.md) §7); Regeln mit hoher
Quote werden von *hart* auf *weich* gestuft oder umformuliert.

---

## P4 — Continuity & Memory Graph vollständig

**Ziel:** Anschlussfehler werden strukturell unwahrscheinlich.

**Umfang**
- Vollständiges Graphmodell mit Zustands-Zeitachse und `provenance`
- Alle Konflikttypen (hart, weich, zeitlich, referenziell, beobachtet)
- Ereignisgetriebene Propagation („Regen ab Panel 12")
- **Anker-Scoring** (Unterscheidungskraft × Sichtbarkeit × Driftrisiko × Erzählrelevanz)
- Anker-Post-Check am erzeugten Bild (VLM)
- Kontinuitätsmodus mit Entitäts-Zeitachse
- ContinuityAuditor-Agent
- Character Sheets als Konditionierungsquelle (wo Modell es unterstützt)

**Exit-Kriterien**
- [ ] Alle 40 Kontinuitätsfixtures erkannt; Falsch-Positiv-Rate ≤ 5 %
- [ ] Anker-Auswahl schlägt naive Auswahl (alle Merkmale) messbar: Identitätsdrift über
      20 Panels sinkt um ≥ 30 % im Blindvergleich
- [ ] Post-Check erkennt verletzte Anker in ≥ 80 % der Fälle
- [ ] Zustandsauflösung < 10 ms bei 500 Zustandsänderungen

---

## P5 — Mehrmodell, Bewegung, Export

**Ziel:** Austauschbarkeit ist bewiesen, nicht nur behauptet.

**Umfang**
- Zwei weitere Modelladapter + Konformitätssuite
- Fähigkeits-Routing mit Budgets; Degradation mit `FidelityRisk`
- Übergangsgrammatik vollständig; Bewegungsbeschreibung für Videomodelle
- Export: Board-PDF mit Begründungsspalte, Shotlist-CSV, Kontinuitätsbericht

**Exit-Kriterien**
- [ ] Modellwechsel mitten im Projekt ändert **keine** Domänendaten; alle Panels bleiben valide
- [ ] Alle Adapter bestehen die Konformitätssuite
- [ ] Degradation ist sichtbar: fehlt `referenceConditioning`, erscheint das Risiko am Panel
- [ ] PDF-Export enthält zu jedem Panel Aufgabe, Kamera und Warum

---

## P6 — Assistant-Tiefe & Zusammenarbeit

**Umfang**
- Sokratischer Modus, Advocatus Diaboli, Lehrmodus mit Regelbeispielen
- Verzweigung und Vergleichsmodus (zwei Fassungen einer Szene nebeneinander, Diff der Begründungen)
- Teilen: Board als Link/Paket für Team-Feedback (lesend)
- iCloud-Sync

**Exit-Kriterien**
- [ ] Sokratischer Modus stellt in Nutzertests Fragen, die als „hilfreich" bewertet werden (≥ 70 %)
- [ ] Vergleichsmodus zeigt Begründungs-Diff zweier Zweige korrekt
- [ ] Lehrmodus erklärt jede Regel-ID mit Beispiel

---

## Was bewusst *nicht* auf der Roadmap steht

| Nicht geplant | Warum |
|---|---|
| Eigenes Modelltraining | Bindet Ressourcen, widerspricht I6 (Austauschbarkeit) |
| Echtzeit-Mehrbenutzer-Bearbeitung | Regie ist selten wirklich gleichzeitig; Feedback-Teilen (P6) deckt den realen Bedarf |
| Vollständiger Videoschnitt | SOULINK plant und begründet; Schnitt gehört ins NLE, dafür der Export |
| „Film aus einem Satz" | Widerspricht der Produktthese — SOULINK verlangt Regieentscheidungen |
| Marktplatz für Stile | Führt direkt in die Stilnachahmungsfrage ([08](08-QUALITAET-NFR.md) §6) |

---

## Reihenfolge-Begründung in einem Satz

P0 vor allem anderen, weil eine Doktrin, die nachgerüstet wird, keine Doktrin ist;
P1 vor der Breite, weil die Produktthese früh scheitern können muss;
P4 nach P3, weil Anker-Scoring wissen muss, welcher Bildausschnitt geplant ist;
P5 nach P4, weil Austauschbarkeit erst dann prüfbar ist, wenn es etwas zu erhalten gibt.
