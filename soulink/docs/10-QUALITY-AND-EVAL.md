# 10 — Qualität, Evaluation, Reproduzierbarkeit

Ein System, das behauptet, nicht zufällig zu sein, muss das **beweisen** können.
Dieses Dokument definiert, wie.

---

## 1. Der Regie-Kritiker

Bewertet **Absichtserfüllung**, nicht Schönheit. Fünf Achsen, je 0–5:

| Achse | Frage | Messung |
|---|---|---|
| **Aufgabenerfüllung** | Erfüllt das Bild seine *eine* Aufgabe? | Vision-Modell + Aufgabenrubrik |
| **Bildlesbarkeit** | Ist der Blick geführt, ist die Hierarchie klar? | Kompositionsanalyse + Saliency |
| **Kontinuitätstreue** | Stimmen Merkmale, Kostüm, Requisiten, Achse? | Abgleich gegen `mustInclude`/`mustAvoid` (deterministisch) |
| **Subtext-Transport** | Ist die zweite Ebene sichtbar? | LLM-Urteil gegen `Subtext.beneath` |
| **Ausführung** | Artefakte, Anatomie, Text im Bild, Rauschen | Vision-Heuristiken |

**Ausgabe ist eine Diagnose, keine Note.** Der Kritiker benennt die Stufe, die
zurück muss:

```
Aufgabe verfehlt      → zurück zu FRAME       (die Aufgabe war unklar)
Kamera falsch         → zurück zu CAMERA      (andere Kandidatenfamilie)
Prompt schwach        → zurück zu COMPOSE     (Dialekt/Gewichtung)
Kontinuität verletzt  → zurück zu CONTINUITY  (Fakt oder Constraint fehlt)
Ausführung schwach    → RENDER mit neuem Seed (der einzige legitime Re-roll)
```

Nur die letzte Zeile ändert den Zufall — und auch sie wird protokolliert. Damit
ist die Aussage „keine Zufallsbilder“ operationalisiert statt behauptet.

---

## 2. Evaluationssuite

### 2.1 Goldene Fälle (Regie-Benchmark)
40 handkuratierte Fälle: Beat + Kontext → erwartete **Kandidatenfamilie**
(nicht ein exakter Shot — Regie hat mehrere richtige Antworten).
*Bestanden,* wenn die gewählte Familie in der erwarteten Menge liegt **und** die
Begründung auf existierende Regel-IDs verweist.

### 2.2 Continuity-Fallen
25 Projekte mit absichtlich eingebauten Widersprüchen (Kostümzustand über
Beat-Grenzen, tote Figur, Achsensprung, Zeitlogik, Wissensstand).
*Ziel:* ≥ 95 % erkannt, 0 falsch-positive HARD-Vetos. Falsch-positive Vetos sind
teurer als übersehene Warnungen — ein Wächter, der grundlos blockiert, wird
abgeschaltet.

### 2.3 Rhythmusprüfung
Generierte 12-Panel-Sequenzen gegen Kontrast- und Ermüdungsmetriken:
Größenvarianz, Achsenwechsel, Wiederholungsabstand, Spannungskorrelation.

### 2.4 Reproduzierbarkeit
Gleicher Zustand + gleiche Eingabe ⇒ byte-identische `ShotSpec` und
`CompiledPrompt` über 100 Durchläufe. Abweichung = Fehler der Stufe P1.

### 2.5 Austauschbarkeit
Ein `FakeAdapter` in CI plus ein realer Zweitadapter. Test schlägt fehl, wenn
`SoulinkStory`, `SoulinkCamera` oder `SoulinkMemory` `SoulinkAdapters`
importieren. Zusätzlich: Integration eines dritten Adapters wird gestoppt
(Zielwert < 1 Personentag).

### 2.6 Begründungsintegrität
Jede `Justification` muss auf eine existierende Quelle zeigen (Beat-ID,
Regel-ID, Graph-Fakt). Erfundene Verweise ⇒ Testfehler. Dieser Test ist die
technische Absicherung gegen halluzinierte Begründungen — die gefährlichste
Fehlerart des Produkts, weil sie *überzeugend* falsch ist.

---

## 3. Testebenen

| Ebene | Umfang | Beispiel |
|---|---|---|
| Unit | Kernel, Validierung, Regelmaschine | `ValueShift(from:.negative,to:.negative)` ⇒ ungültig |
| Snapshot | Prompt-Kompilierung | IR-Fixture ⇒ erwarteter Prompt je Dialekt |
| Graph | Continuity-Abfragen | überlappende Fakten ⇒ Widerspruch erkannt |
| Vertrag | Agentenschemata | ungültiges LLM-JSON ⇒ Fallback auf Regelbasis |
| Integration | Engine-Zustandsmaschine | Veto in CONTINUITY ⇒ kein RENDER |
| UI | Layout, VoiceOver, Dynamic Type | WARUM-Panel bleibt bei XXL vollständig |
| Manuell | Regie-Review mit Fachleuten | Quartalsweise mit Kamerafrau/Cutter |

Die letzte Zeile ist kein Beiwerk: Kein automatischer Test kann beurteilen, ob
eine Sequenz *erzählt*. Menschliches Fachurteil bleibt die oberste Instanz —
das System soll es unterstützen, nicht ersetzen.

---

## 4. Telemetrie (lokal, opt-in)

Gemessen wird nur, was eine Produktentscheidung ändert:
Re-roll-Quote nach Ursache, Veto-Häufigkeit nach Typ, Override-Quote mit
Begründungslänge, WARUM-Panel-Öffnungen, Zeit bis zur ersten Sequenz,
Kosten pro Sequenz, Adapter-Latenz.

Alles bleibt lokal auswertbar; Übertragung ist opt-in und aggregiert.
Projektinhalte werden nie übertragen — die Bibel eines Nutzers ist sein Werk,
nicht unsere Datenquelle.

---

## 5. Definition of Quality (produktweit)

Eine Sequenz gilt als „SOULINK-Qualität“, wenn:

1. jedes Panel genau eine benennbare Aufgabe hat,
2. jede Kameraentscheidung auf eine Regel-ID oder eine Nutzerentscheidung zeigt,
3. keine offenen HARD-Vetos bestehen,
4. jede Fortsetzung eine typisierte Logik trägt,
5. die Begründungskette lückenlos vom Bild bis zur Prämisse zurückführt,
6. und die Sequenz mit denselben Eingaben erneut erzeugbar ist.

Punkt 5 ist die Probe aufs Exempel: **Man muss von jedem einzelnen Bild aus
rückwärts bis zur Prämisse laufen können.** Wo diese Kette reißt, war Zufall
im Spiel — und genau dort setzt die nächste Verbesserung an.
