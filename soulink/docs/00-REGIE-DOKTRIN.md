# 00 — Regie-Doktrin

> Die verbindlichen Invarianten des Systems. Kein Modul darf sie verletzen.
> Jede Architekturentscheidung in den folgenden Dokumenten leitet sich aus diesem Dokument ab.

Die Doktrin übersetzt vier Regieprinzipien in **prüfbare Systeminvarianten**. Ein Prinzip,
das nur in der Produktbeschreibung steht, ist Marketing. Ein Prinzip, das der Compiler und
der Validator durchsetzen, ist Architektur.

---

## I1 — Ein Panel, eine Aufgabe

**Regie-Satz:** Jedes Panel hat genau eine Aufgabe.

**Was das heißt.** Ein Panel (die atomare erzählerische Einheit; bei uns die Ebene, auf der
später genau ein Bild oder eine Einstellung entsteht) transportiert genau eine dramaturgische
Funktion. Ein Panel, das gleichzeitig eine Figur einführt, einen Ort etabliert *und* eine
Wendung enthüllt, ist kein starkes Panel — es sind drei schwache.

**Der Aufgaben-Katalog (`PanelJob`).** Genau einer pro Panel:

| Aufgabe | Erzählerische Funktion |
|---|---|
| `establish` | Raum, Zeit, geografische Ordnung herstellen |
| `introduce` | Eine Figur/ein Objekt erstmals lesbar machen |
| `state` | Einen inneren Zustand sichtbar machen |
| `intent` | Eine Absicht/ein Ziel setzen |
| `action` | Eine Handlung vollziehen |
| `reaction` | Auf eine Handlung antworten |
| `reveal` | Eine Information freigeben, die den Sinn ändert |
| `escalate` | Den Einsatz erhöhen |
| `withhold` | Information bewusst verweigern (Spannung durch Auslassung) |
| `transition` | Zwei Einheiten verbinden (räumlich, zeitlich, thematisch) |
| `punctuate` | Rhythmisch setzen (Atempause, Beat, Cut-away) |
| `resolve` | Eine Spannung schließen |

**Erzwingung.**
1. **Typebene:** `narrativeJob: PanelJob` — ein Wert, nicht optional, keine Collection.
2. **Validator:** Der `PanelJobValidator` prüft die Panel-Beschreibung gegen den deklarierten
   Job. Erkennt er Signale für einen zweiten Job (z. B. eine Enthüllung in einem
   `establish`-Panel), erzeugt er kein Bild, sondern eine **Split-Empfehlung** mit
   vorgeschlagener Panelfolge.
3. **UI:** Der Job steht als Label am Panel — nicht in einem Untermenü.

**Bewusste Ausnahme.** Ein *Kompressionspanel* (z. B. eine Etablierung, die zugleich einen
Zustand zeigt) ist zulässig, muss aber explizit als `compressed(primary:secondary:)` markiert
und begründet werden. Die Ausnahme ist teuer gemacht, damit sie selten bleibt.

---

## I2 — Keine Kamera ohne Zweck

**Regie-Satz:** Jede Kamera verfolgt einen erzählerischen Zweck.

**Was das heißt.** Es gibt im System **keinen Pfad**, auf dem Kameraparameter entstehen
können, ohne dass zuvor eine erzählerische Absicht deklariert wurde. Die Ableitungsrichtung
ist unumkehrbar:

```
Absicht  →  Grammatikregel  →  Parameter        ✅ der einzige erlaubte Weg
Parameter →  nachträgliche Begründung           ❌ vom System nicht konstruierbar
```

Das ist keine Konvention, sondern eine Frage der Typen: `CameraSetup` besitzt keinen
öffentlichen Initializer mit freien Parametern. Der einzige Weg zu einem `CameraSetup`
führt über `CameraIntelligence.derive(intent:context:)`. Manuelle Übersteuerung durch den
Menschen ist möglich (`OverrideSource.human`) — sie erzeugt dann aber eine
`Rationale` mit `author: .human` und ist im Ledger als bewusste Regelabweichung sichtbar.

**Erzwingung.**
1. Nicht-öffentlicher Initializer + Factory-Zwang (siehe [03](03-MODULE.md), Camera Intelligence).
2. `CameraSetup.intent: CameraIntent` ist Pflichtfeld.
3. Der `GrammarAuditor` prüft nachgelagert, ob die Parameter zur Absicht passen — eine
   Weitwinkel-Totale mit Absicht `intimacy` wird als Widerspruch gemeldet, nicht still akzeptiert.

---

## I3 — Keine Fortsetzung ohne Dramaturgie

**Regie-Satz:** Jede Fortsetzung ist dramaturgisch begründet.

**Was das heißt.** Eine Fortsetzung ist nie „das nächste hübsche Bild", sondern die Antwort
auf eine offene Frage des vorherigen Bildes. Das System modelliert diese offenen Fragen
explizit als **Spannungsvektoren** (`TensionVector`): unaufgelöste Kräfte im Bild —
ein Blick aus dem Frame, eine verdeckte Hand, eine Tür im Rücken, ein Machtgefälle.

Jede `ContinuationOption` muss:
- **genau einen** Spannungsvektor adressieren (`addresses: TensionVector.ID`),
- einem **Strategie-Archetyp** zugeordnet sein (Eskalation, Enthüllung, Umkehrung,
  Verzögerung, Kontrast, Annäherung, Konsequenz),
- ein **erwartetes Spannungsdelta** angeben (`expectedTensionDelta: Double`),
- ihre **Position im Bogen** benennen (`arcPosition`).

**Die Diversitätsbedingung.** Werden mehrere Optionen angeboten, gilt:
> Keine zwei Optionen dürfen denselben Strategie-Archetyp **und** dieselbe Kamerarelation belegen.

Das ist die eigentliche technische Antwort auf „Gib keine zufälligen Ergebnisse aus": Optionen
werden nicht durch mehrfaches Sampling desselben Modells erzeugt (das liefert Varianten
derselben Idee), sondern durch **systematische Abdeckung des Strategieraums**. Der
`OptionSetValidator` verwirft ein Optionsset, das die Bedingung verletzt, und fordert
Nachsynthese für die fehlenden Archetypen.

---

## I4 — Kein Warum, kein Artefakt

**Regie-Satz:** Jede Entscheidung braucht ein klares Warum.

**Die `Rationale`.** Pflichtbestandteil jeder persistierten Entscheidung:

```
Rationale
├── claim          Was wird behauptet/entschieden? (ein Satz)
├── because        Die dramaturgische Begründung (Wirkung, nicht Geschmack)
├── grounds        Belege: Beat-ID, Regel-ID, Kontinuitätsfakt, Referenzbefund
├── alternatives   Verworfene Optionen + Grund der Verwerfung
├── confidence     0…1, plus Unsicherheitsquelle
└── author         .system(module) | .agent(name) | .human
```

**Das Rationale Gate.** Die Director Engine akzeptiert keinen Vorschlag, dessen `Rationale`
leer, generisch oder unbelegt ist. Drei Prüfungen:

| Prüfung | Verwirft |
|---|---|
| **Vollständigkeit** | Leere Felder, `grounds` ohne Referenz |
| **Nicht-Zirkularität** | „Weil es besser aussieht", „weil es dramatischer ist" ohne benannte Wirkung |
| **Belegbarkeit** | `grounds`, die auf nicht-existente Beats/Regeln/Fakten zeigen |

Fällt ein Vorschlag durch, wird er **nicht** stillschweigend verworfen: Er geht mit dem
Prüfbefund zurück an den Agenten (Reparaturschleife, max. 2 Runden, siehe [05](05-AGENTEN.md)).

**Sichtbarkeit.** Das Warum ist kein Debug-Log. Es ist erstklassiges UI: der *Reasoning
Inspector* ist eine permanente Zone der Oberfläche, kein Tooltip (siehe [06](06-UX-IPAD.md)).

---

## I5 — Determinismus vor Diffusion

**Regie-Satz (ergänzend):** Das Modell würfelt erst, wenn die Regie fertig ist.

Kein Generierungsaufruf ohne vollständig aufgelöste, validierte `PromptIR`. Konkret:

- Gleicher Projektzustand + gleicher Seed ⇒ **identischer Prompt**, byteweise.
- Jeder `GenerationJob` speichert: `promptIRHash`, `modelDescriptorID`, `seed`,
  `decisionLedgerCursor`. Damit ist jedes Bild bis auf die Entscheidung rückverfolgbar,
  die es verursacht hat.
- Nicht-Determinismus ist erlaubt — aber nur an **einer** Stelle (dem Bildmodell) und nur
  mit protokolliertem Seed.

---

## I6 — Austauschbarkeit ist Pflicht

**Regie-Satz (ergänzend):** Kein Modul kennt ein Modell.

- Die Domänenschicht enthält **null** Referenzen auf Anbieter, Modellnamen oder Prompt-Dialekte.
- Modelle werden über `ModelDescriptor` beschrieben (Fähigkeiten, Kosten, Latenz,
  Seed-Fähigkeit, Referenzkonditionierung) und über Fähigkeits-Routing ausgewählt.
- Fehlt einem Zielmodell eine Fähigkeit, **degradiert** der Prompt Composer bewusst und
  markiert das Risiko (`FidelityRisk`), statt still schlechtere Ergebnisse zu liefern.

---

## Konfliktordnung

Wenn Module widersprechen, entscheidet die Director Engine nach fester Rangfolge:

```
1. Kontinuität      (Ein Anschlussfehler zerstört Glaubwürdigkeit sofort)
2. Dramaturgie      (Der Beat muss seine Funktion erfüllen)
3. Filmsprache      (Grammatik dient der Dramaturgie, nicht umgekehrt)
4. Ästhetik / Stil  (Zuletzt — aber protokolliert)
```

Jede Auflösung erzeugt einen `ArbitrationRecord` mit unterlegener Position und Grund.
Ein Regisseur muss sehen können, *was* seine Entscheidung gekostet hat.

**Bewusste Regelbrüche.** Filmsprache lebt vom motivierten Bruch (Achsensprung als
Desorientierung, Jump-Cut als Zerfall). SOULINK verbietet Brüche nicht — es verlangt, dass
sie als `intentionalViolation(rule:purpose:)` deklariert werden. Ein unmarkierter Bruch ist
ein Fehler; ein markierter ist Regie.
