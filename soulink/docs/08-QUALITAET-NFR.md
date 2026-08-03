# 08 — Qualität, nicht-funktionale Anforderungen, Recht

---

## 1. Nicht-funktionale Anforderungen im Detail

### 1.1 Performance-Budgets

| Operation | Budget | Klasse |
|---|---|---|
| Grammatikprüfung eines Schnitts | < 5 ms | deterministisch |
| Kontinuitätsauflösung `state(of:at:)` | < 10 ms | deterministisch |
| Vollständiges Szenenaudit (50 Panels) | < 100 ms | deterministisch |
| Prompt-Komposition (IR + Rendering) | < 30 ms | deterministisch |
| Ledger-Wiedergabe ab Snapshot (500 Entscheidungen) | < 250 ms | deterministisch |
| Board-Scroll (200 Panels) | 120 fps, keine Frame-Drops | UI |
| Referenzanalyse vollständig | < 25 s, erste Stufe < 3 s | Modell |
| Kamera-Vorschlag | < 3 s | Modell |

**Warum die deterministischen Budgets so aggressiv sind:** Sie definieren, was sich
*sofort* anfühlt. Wenn Achsenprüfung und Kontinuitätsauflösung im Millisekundenbereich
laufen, können sie *während* der Geste laufen (Grundriss-Modus, [06](06-UX-IPAD.md) §4.4).
Das ist der Unterschied zwischen einem Werkzeug, das warnt, und einem, das führt.

### 1.2 Speicher & Energie

- Board mit 500 Panels: < 400 MB Arbeitsspeicher (Miniaturen als Cache, verwerfbar)
- Bildassets nie vollständig im Speicher; inhaltsadressierte Datei-Referenzen
- Keine Hintergrund-Modellaufrufe ohne Nutzeraktion — Akku ist auf dem iPad ein Feature
- Analyse-Caching am Asset-Hash: dasselbe Bild wird nie zweimal analysiert

### 1.3 Offline-Verhalten

| Funktion | Ohne Netz |
|---|---|
| Struktur bearbeiten, Beats, Panels, Aufgaben | ✅ vollständig |
| Grammatikprüfung, Achse, Anschluss | ✅ vollständig |
| Kontinuitätsauflösung und -audit (harte Konflikte) | ✅ vollständig |
| Prompt-Komposition + IR | ✅ vollständig |
| Story-Diagnose (Kurvenanalyse) | ✅ vollständig |
| Referenzanalyse, Fortsetzungsvorschläge, Bildgenerierung | ❌ Warteschlange |

Das ist keine Notlösung, sondern Folge der Kern/Peripherie-Trennung: Der wertvollste Teil
von SOULINK — die Regie-Logik — braucht kein Netz.

---

## 2. Teststrategie

### 2.1 Testpyramide

```
        ╱ Eval-Sets (Agentenqualität, nicht deterministisch)
       ╱  UI-Tests (Kernabläufe, Barrierefreiheit)
      ╱   Integrationstests (Use Cases, Ledger, Gateway-Konformität)
     ╱    Golden-Tests (Prompt-Rendering, Begründungsketten)
    ╱     Unit-Tests (Grammatik, Kontinuität, Spannungsmathematik, Validatoren)
```

### 2.2 Invarianten-Tests (das Wichtigste)

Ein Test je Doktrin-Invariante, der beweist, dass der Bruch **unmöglich** ist:

| Invariante | Test |
|---|---|
| I1 | Panel mit zwei Jobs lässt sich nicht konstruieren (Typebene); Validator erkennt Doppelaufgabe in der Beschreibung und schlägt Split vor |
| I2 | Es existiert kein Pfad zu `CameraSetup` ohne `CameraIntent` (API-Oberflächentest + Reflexion über öffentliche Initializer) |
| I3 | Optionsset mit zwei gleichen (Archetyp, Relation)-Paaren wird abgelehnt; Nachsynthese wird angefordert |
| I4 | Decision ohne gültige Rationale wird abgelehnt; Fuzz-Test mit 200 Floskel-Begründungen aus dem Negativkorpus |
| I5 | Gleicher Ledger-Cursor + Seed ⇒ byte-identischer Prompt (über alle Renderer) |
| I6 | Lint: kein Anbieter-/Modellname im Package `SoulinkDomain`; Build bricht ab |

### 2.3 Fixtures

- **Kontinuitätsfixtures:** 40 Szenen mit absichtlich eingebauten Anschlussfehlern
  (Kostüm, Requisit, Licht, Tageszeit, Verletzung), je mit erwartetem Befund.
- **Grammatikfixtures:** 30 Schnittfolgen mit bekannten Verstößen (Achse, 30°, Screen
  Direction, unmotivierte Bewegung) und 30 saubere als Falsch-Positiv-Kontrolle.
- **Kurvenfixtures:** Beat-Folgen mit Plateau, Sägezahn, vorzeitigem Gipfel.
- **Negativkorpus Begründungen:** 200 Floskeln („dramatischer", „sieht besser aus",
  „cinematic", „weil es passt") — das Gate muss alle ablehnen.
- **Golden Prompts:** Je Renderer 25 IR-Fixtures mit erwarteter Ausgabe.

### 2.4 Gateway-Konformitätssuite

Jeder Modelladapter muss bestehen:

1. **Ehrliche Fähigkeitsdeklaration** — deklariertes `seedControl` erzeugt bei gleichem Seed
   tatsächlich gleiche Ausgabe (Toleranztest); `referenceConditioning` wirkt messbar.
2. **Determinismus des Renderers** — gleiche IR ⇒ byte-gleicher Prompt, 100 Durchläufe.
3. **Fehlerübersetzung** — jeder Anbieterfehler mappt auf eine SOULINK-Fehlerklasse.
4. **Abbruch** — Stornierung beendet den Aufruf und, wo möglich, den Auftrag beim Anbieter.
5. **Keine semantische Ergänzung** — Renderer fügt keine Begriffe hinzu, die nicht in der
   IR stehen (Diff-Test gegen IR-Wortmenge + erlaubte Syntaxtokens).

---

## 3. Eval-Harness für Agentenqualität

Modelle lassen sich nicht unit-testen. Sie werden **bewertet**, versioniert und verglichen.

### 3.1 Aufbau

```
evals/
├── reference-analysis/     50 Bilder + Expertenannotation je Stufe
├── continuation/           30 Bilder + von Regisseuren erstellte Referenzsets
├── continuity-audit/       40 Szenen mit bekannten Fehlern
├── camera-derivation/      60 Beats mit Expertenlösung
└── rationale-quality/      200 Begründungen, blind bewertet (gut / floskelhaft)
```

### 3.2 Metriken

| Eval | Metrik | Schwelle |
|---|---|---|
| Referenzanalyse | Feldgenauigkeit Einstellungsgröße / Höhe / Brennweitenklasse | ≥ 80 % / 85 % / 70 % |
| Referenzanalyse | Vektor-Recall gegen Expertenliste | ≥ 70 % |
| Fortsetzungen | **Strategiedistanz** (mittlere paarweise Distanz im Merkmalsraum aus Archetyp, Relation, Δ, Aufgabe) | ≥ 0,6 |
| Fortsetzungen | Blindbewertung „würde ich als Regisseur ernsthaft erwägen" | ≥ 3 von 5 Optionen |
| Kontinuitätsaudit | Recall | ≥ 90 % |
| Kontinuitätsaudit | **Falsch-Positiv-Rate** | ≤ 5 % |
| Kameraableitung | Übereinstimmung mit Regelkorpus | ≥ 90 % |
| Begründungsqualität | Anteil als floskelhaft bewerteter Begründungen | ≤ 5 % |

**Die Falsch-Positiv-Rate ist die kritischste Zahl im ganzen Dokument.** Ein Werkzeug, das
zu oft grundlos warnt, wird abgeschaltet — und dann nützt auch der beste Recall nichts.
Deshalb liegt die Schwelle für Falsch-Positive strenger als für verpasste Fehler.

### 3.3 Regressionsschutz

- Jede Prompt-, Modell- oder Regelkorpusänderung läuft gegen alle Eval-Sets.
- Ergebnisse werden **pro Modellversion** gespeichert → stille Anbieteränderungen werden sichtbar.
- Verschlechterung über Schwelle blockiert die Auslieferung.

---

## 4. Guardrails

| Risiko | Guardrail |
|---|---|
| **Floskel-Begründungen** | Nicht-Zirkularitätsprüfung: Musterliste + semantischer Abgleich gegen Negativkorpus |
| **Halluzinierte Belege** | Typisierte `Ground`s; jede ID wird gegen den Projektzustand aufgelöst |
| **Optionskollaps** | Diversitätsbedingung, deterministisch geprüft *vor* der Anzeige |
| **Überkonfidenz** | Kalibrierungsregel je Stufe; erzwungene `sourceOfDoubt` bei mehrdeutigem Material |
| **Stille Modell-Schwäche** | `FidelityRisk` sichtbar am Panel; Anker-Post-Check am Ergebnis |
| **Kostenexplosion** | Budget je Agent, Analyse-Caching, Abbruch bei Kontextverlassen, Kostenanzeige pro Ablauf |
| **Prompt Injection über Referenzbilder** (Text im Bild) | Bildbefunde werden als **Daten** behandelt, nie als Anweisung; Text im Bild wird als beobachteter Inhalt protokolliert, nicht ausgeführt |
| **Regelkorpus-Drift** | Regeln versioniert; `Ground` referenziert die Fassung, die galt |

---

## 5. Datenschutz

- **Lokal zuerst.** Projektpaket, Ledger, Graph und Assets liegen auf dem Gerät.
- **Sichtbarer Netzausgang.** Jeder Aufruf, der ein Bild oder Projekttext an ein Modell
  sendet, wird angezeigt — mit Angabe, *was* gesendet wird (Bild, Kontextbündel).
- **Datensparsame Bündelung.** Agenten erhalten kuratierte Bündel, nie das Gesamtprojekt
  ([05](05-AGENTEN.md) §6) — das ist zugleich Datenschutz und Qualitätsmaßnahme.
- **Kein Training auf Nutzerdaten** ohne ausdrückliche, widerrufbare Zustimmung.
- **Löschung:** Projekt löschen entfernt Assets, Analysen und Ledger vollständig; keine
  Schattenkopien in Caches (Cache-Schlüssel sind an das Projekt gebunden).

---

## 6. Rechtliche Leitplanken

**Referenzbilder.** SOULINK analysiert vom Nutzer bereitgestellte Bilder. Verantwortung für
die Rechte liegt beim Nutzer; das Produkt weist beim Import darauf hin und speichert die
Analyse als Beschreibung, nicht als Reproduktion.

**Keine Stilnachahmung namentlich genannter Personen.** Anfragen der Form „im Stil von
[lebender Künstler / Regisseur / Fotograf]" werden nicht ausgeführt. Angeboten wird
stattdessen die **Beschreibung der Bildmittel**: Lichtführung, Optik, Palette, Kontrast,
Bewegungssprache. Das ist fachlich präziser und rechtlich sauber — und pädagogisch besser,
weil der Nutzer lernt, *woraus* ein Look besteht.

**Keine geschützten Figuren, Marken oder Filmästhetiken** als Zielvorgabe. Der
Kontinuitäts-Kanon einer Figur ist eine Originalbeschreibung des Nutzers.

**Kennzeichnung.** Generierte Bilder tragen im Export Metadaten (C2PA-kompatibel, wo
verfügbar), die sie als KI-generiert ausweisen — inklusive Modell und Zeitpunkt.

**Inhaltliche Grenzen.** Das System erzeugt keine Darstellungen realer Personen in
erfundenen Situationen und keine Inhalte, die Personen schaden könnten. Dramaturgisch harte
Stoffe (Gewalt, Konflikt, Trauma) sind zulässig — sie sind das Material des Erzählens; die
Grenze verläuft bei realen identifizierbaren Personen und bei Darstellungen, die
außerhalb der Fiktion Schaden anrichten.

---

## 7. Beobachtbarkeit

| Signal | Zweck |
|---|---|
| Ledger-Wachstum, Entscheidungen je Sitzung | Nutzungstiefe |
| Optionsakzeptanzrate je Archetyp | Welche Strategien tragen — Rückkopplung in den Planer |
| Reparaturschleifen je Agent | Prompt- und Schemaqualität |
| Falsch-Positiv-Meldungen („bewusst so" - Quote je Regel) | Regelkorpus zu streng? |
| Anker-Post-Check-Fehlerquote je Modell | Modellauswahl und Anker-Scoring kalibrieren |
| Latenz je Stufe | Budgeteinhaltung |

Alle Signale sind **lokal einsehbar** (Entwickler-Ansicht) und werden nur mit Zustimmung
aggregiert übertragen. Die „bewusst so"-Quote je Regel ist dabei besonders wertvoll: Sie
misst, ob das System einen Regelbegriff hat, der zur Praxis passt.
