# 10 — Architekturentscheidungen (ADR)

Format je Eintrag: Kontext · Entscheidung · Alternativen · Konsequenzen.
Status: `angenommen` | `vorgeschlagen` | `abgelöst`.

---

## ADR-001 — Deterministischer Kern, probabilistische Peripherie

**Status:** angenommen

**Kontext.** Der naheliegende Bau eines KI-Regiewerkzeugs ist: ein großes Modell, viel
Kontext, alles per Prompt. Das ist schnell gebaut, aber nicht reproduzierbar, nicht
erklärbar, nicht offline und nicht prüfbar. Genau diese vier Eigenschaften sind aber die
Produktthese.

**Entscheidung.** Regelwerke (Shot-Grammatik, Achsen, Kontinuitätsauflösung,
Spannungsmathematik, Diversitätsprüfung, Prompt-Komposition) sind gewöhnlicher Swift-Code.
Modelle liefern ausschließlich Interpretationen und Vorschläge; sie besitzen nie Zustand.

**Alternativen.**
- *Alles im Modell* — verworfen: keine Reproduzierbarkeit, keine Offline-Fähigkeit,
  Begründungen sind selbst generiert und damit nicht prüfbar.
- *Alles regelbasiert* — verworfen: Bildverständnis und sprachliche Formulierung sind
  regelbasiert nicht leistbar.

**Konsequenzen.** (+) Testbarkeit, Offline-Kern, ehrliche Begründungen, Kostenkontrolle.
(−) Mehr Code, ein gepflegter Regelkorpus, langsamere erste Demo.

---

## ADR-002 — Event-Sourcing für den Projektzustand

**Status:** angenommen

**Kontext.** „Jede Entscheidung braucht ein klares Warum" (I4) verlangt, dass die Begründung
so haltbar ist wie das Ergebnis. In einem Dokumentmodell wandert sie in ein Nebenfeld und
driftet.

**Entscheidung.** Append-only-Ledger aus `Decision`-Einträgen; der Projektzustand ist ein
Fold über das Ledger. Korrektur = neuer Eintrag mit `supersedes`, nie Überschreiben.

**Alternativen.**
- *Dokumentmodell + Änderungslog* — verworfen: Log und Zustand können auseinanderlaufen.
- *CRDT* — verschoben: erst bei echter Mehrbenutzer-Gleichzeitigkeit (P6) relevant.

**Konsequenzen.** (+) Zeitreise, Verzweigung, Begründungsketten, Reproduzierbarkeit
kostenlos. (−) Wiedergabekosten (gelöst durch Snapshots), höhere Einstiegskomplexität,
Migrationen müssen alte Entscheidungstypen lesbar halten.

---

## ADR-003 — `PromptIR` als modellneutrale Zwischenschicht

**Status:** angenommen

**Kontext.** Prompt-Wissen ist heute an ein Modell gebunden; ein Modellwechsel vernichtet es.
„Modelle müssen austauschbar bleiben" ist eine Kernvorgabe (I6).

**Entscheidung.** Der Prompt Composer erzeugt eine strukturierte, modellneutrale IR.
Pro Modell existiert ein `PromptRenderer`, der die IR übersetzt. Renderer dürfen umsortieren
und in Anbieter-Syntax übersetzen, aber **nichts semantisch ergänzen**.

**Alternativen.**
- *Prompt-Templates je Modell* — verworfen: Die Regie-Semantik läge dann in Textbausteinen
  und wäre nicht prüfbar.
- *Ein „universeller" Promptstring* — verworfen: Es gibt ihn nicht; Modelle unterscheiden
  sich in Gewichtung, Reihenfolge und Steuerparametern erheblich.

**Konsequenzen.** (+) Modellwechsel ohne Domänenänderung, Prompt-Diffs, Golden-Tests.
(−) Zwei Übersetzungsschritte; jeder neue Adapter braucht die Konformitätssuite.

---

## ADR-004 — Filmsprachregeln als Daten, nicht als Code

**Status:** angenommen

**Kontext.** Filmsprache ist historisch, kulturell und genrespezifisch. Ein Korpus, der für
jede Änderung einen Rebuild braucht, wird nicht gepflegt.

**Entscheidung.** Regeln, Strukturvorlagen, Strategie-Archetypen und Übergangsgrammatik
liegen als versionierte YAML-Dateien vor, mit `id`, Bedingung, Wirkung, Begründungstext,
Herkunft und Schweregrad. Projekte können sie über einen `ProjectRuleOverlay` überschreiben —
was selbst begründungspflichtig ist.

**Alternativen.**
- *Regeln in Swift* — verworfen: nicht von Fachautoren pflegbar, nicht projektspezifisch.
- *Regeln im Modell-Prompt* — verworfen: nicht versionierbar, nicht prüfbar, nicht zitierbar.

**Konsequenzen.** (+) Fachliche Pflege ohne Entwicklung, zitierbare Belege (`rule(RuleID)`
zeigt auf eine Fassung), Genre-Forks möglich. (−) Loader, Schemaprüfung und
Versionsverwaltung nötig; Regelqualität wird zu einer eigenen Disziplin.

---

## ADR-005 — Genau eine Aufgabe je Panel, erzwungen auf Typebene

**Status:** angenommen

**Kontext.** „Jedes Panel hat genau eine Aufgabe" könnte man als Empfehlung im Handbuch
führen. Dann würde sie ignoriert.

**Entscheidung.** `narrativeJob` ist ein einzelner, nicht-optionaler Wert. Mehrfachaufgaben
sind nicht darstellbar. Der Ausnahmefall `compressed(primary:secondary:)` existiert, ist aber
explizit zu deklarieren und begründungspflichtig.

**Alternativen.**
- *`jobs: [PanelJob]`* — verworfen: macht den Regelfall zur Ausnahme; Panels würden
  routinemäßig überladen.
- *Nur Validator-Warnung* — verworfen: Warnungen ohne Typunterstützung werden weggeklickt.

**Konsequenzen.** (+) Das Prinzip ist nicht umgehbar; Boards werden lesbarer.
(−) Nutzer, die gewohnt sind, alles in ein Bild zu packen, empfinden Reibung — genau die
Reibung, die das Produkt erzeugen soll.

---

## ADR-006 — Kameraparameter ausschließlich aus `CameraIntent`

**Status:** angenommen

**Kontext.** In jedem Werkzeug, das freie Kamerafelder anbietet, entstehen Einstellungen
zuerst und Begründungen hinterher. Nachträgliche Begründungen sind Rationalisierungen.

**Entscheidung.** `CameraSetup` hat keinen öffentlichen Initializer mit freien Parametern.
Der einzige Weg führt über `CameraIntelligence.derive(intent:context:)`. Manuelle
Übersteuerung ist möglich, erzeugt aber eine `Rationale` mit `author: .human` und ist als
Regelabweichung im Ledger sichtbar.

**Alternativen.**
- *Freie Felder + Pflichtbegründungsfeld* — verworfen: erzeugt Floskeln.
- *Kein manuelles Übersteuern* — verworfen: bevormundet Fachleute und verhindert den
  motivierten Regelbruch, der Filmsprache ausmacht.

**Konsequenzen.** (+) Die Ableitungsrichtung ist im Typsystem verankert.
(−) Die API ist unbequemer; Tests brauchen Fabriken statt freier Initialisierung.

---

## ADR-007 — Bildanalyse-Stufen 1–4 ohne Story-Kontext

**Status:** angenommen

**Kontext.** Erwartungsgetriebene Wahrnehmung ist der häufigste Fehler bei Bildanalysen
durch Vision-Modelle: Wer dem Modell zuerst die Geschichte erzählt, bekommt sie im Bild
bestätigt — auch wenn sie nicht drin ist. Damit wären alle darauf gestützten Begründungen
zirkulär.

**Entscheidung.** Stufen 1–4 (technisch, kompositorisch, kameratechnisch, inhaltlich)
erhalten Bild und Stilprofil, aber **keinen** Story Spine und keine Prämisse. Erst Stufe 5
darf deuten, und sie deutet auf den protokollierten Befunden.

**Alternativen.**
- *Voller Kontext in allen Stufen* — verworfen: Zirkularität, überkonfidente Befunde.
- *Gar kein Kontext bis Stufe 7* — verworfen: Stufe 5/6 brauchen den Bogen, um Position
  und Beat-Funktion einzuschätzen.

**Konsequenzen.** (+) Beobachtung ist von Deutung trennbar und einzeln prüfbar; der
Inspector kann beides getrennt zeigen. (−) Ein Modellaufruf mehr; gelegentlich werden
Details als unklar gemeldet, die mit Kontext eindeutig wären — das ist der gewollte Preis.

---

## ADR-008 — Optionen durch Strategie-Abdeckung statt durch Sampling

**Status:** angenommen

**Kontext.** „Gib mir fünf Fortsetzungen" liefert fünf Varianten derselben naheliegenden
Idee, weil Modelle auf den wahrscheinlichsten Pfad zusteuern. Höhere Temperatur erzeugt
Rauschen, keine Alternativen.

**Entscheidung.** Ein deterministischer Archetyp-Planer wählt anhand von Vektortyp,
Beat-Funktion und Bogenposition, welche Strategien tragen, und vergibt zusätzlich je Option
eine Kamerarelation. Danach läuft **ein** Agentenaufruf je Archetyp mit der Auflage, die
Strategie nicht zu wechseln. Die Diversitätsbedingung (keine zwei Optionen mit gleicher
Archetyp/Relation-Kombination) wird deterministisch geprüft.

**Alternativen.**
- *n-faches Sampling + Deduplizierung* — verworfen: dedupliziert Formulierungen, nicht Ideen.
- *Ein Aufruf mit der Bitte um Vielfalt* — verworfen: Vielfalt bleibt oberflächlich.

**Konsequenzen.** (+) Optionen sind nachweislich verschiedene Regieentscheidungen; die
Vielfalt ist messbar (Strategiedistanz) und reproduzierbar. (−) Mehr parallele Aufrufe
(Kosten), und wenn nur zwei Archetypen tragen, gibt es nur zwei Optionen — was ehrlicher,
aber erklärungsbedürftig ist.

---

## ADR-009 — Kontinuitätszustände auf einer Zeitachse, nicht an Entitäten

**Status:** angenommen

**Kontext.** Anschlussfehler entstehen fast immer, weil ein Zustand global gedacht wird
(„sie trägt den Mantel"), obwohl er einen Anfang, eine Ursache und ein Ende hat.

**Entscheidung.** Zustände werden als `StateChange` mit `effectiveFrom: PanelIndex` und
optionaler Ursache modelliert. Abfragen laufen immer zeitpunktbezogen und liefern
`provenance` mit.

**Alternativen.**
- *Eigenschaften direkt an der Entität* — verworfen: kann den Fehler nicht einmal
  darstellen, geschweige denn erkennen.
- *Zustand je Panel vollständig kopiert* — verworfen: redundant, driftet, unauffindbare Ursachen.

**Konsequenzen.** (+) Widersprüche sind berechenbar; Kontinuität wird begründbar
(„gilt seit Panel 11, verursacht durch den Regen"). (−) Jede Abfrage ist eine Auflösung;
Caching und Indizes nötig, um das 10-ms-Budget zu halten.

---

## ADR-010 — Fähigkeits-Routing mit sichtbarer Degradation

**Status:** angenommen

**Kontext.** Modelle unterscheiden sich in Steuerfähigkeiten (Seed, Referenzkonditionierung,
Posen, Seitenverhältnisse). Ein System, das das verschweigt, liefert unerklärlich schlechte
Ergebnisse.

**Entscheidung.** Aufrufe nennen Fähigkeiten und Anforderungen, nie Modelle. Fehlt eine
Fähigkeit, kompensiert der Composer bewusst (z. B. Anker textuell verstärken) und erzeugt
einen sichtbaren `FidelityRisk` am Panel.

**Alternativen.**
- *Hartes Modell-Pinning* — verworfen: widerspricht I6.
- *Stille Degradation* — verworfen: verletzt den Grundsatz „nie stille Qualitätsminderung".

**Konsequenzen.** (+) Der Nutzer weiß vorher, wo es schwierig wird; Modellwechsel ist
folgenlos für die Regie. (−) Deskriptoren müssen gepflegt und durch Konformitätstests
verifiziert werden — Anbieterangaben allein sind nicht vertrauenswürdig.

---

## ADR-011 — Der Director Assistant hat keine Schreibrechte

**Status:** angenommen

**Kontext.** Ein Assistent, der direkt Zustand ändert, umgeht die Validatoren und wird zur
zweiten Wahrheit neben dem Ledger.

**Entscheidung.** Der Assistant formuliert ausschließlich `Proposal`s. Sie laufen durch
dieselbe Prüfkette wie jede andere Eingabe.

**Alternativen.**
- *Assistant mit Werkzeugzugriff auf den Zustand* — verworfen: Invarianten wären umgehbar,
  und Fehler wären nicht mehr auf eine Ursache zurückführbar.

**Konsequenzen.** (+) Eine einzige Wahrheit, eine einzige Prüfkette; Assistant-Fehler
richten keinen Schaden an. (−) Manche Aktionen brauchen einen zusätzlichen Bestätigungsschritt —
akzeptabel, weil Regieentscheidungen ohnehin bestätigt gehören.

---

## ADR-012 — Genau ein Spannungsvektor je Fortsetzungsoption

**Status:** angenommen

**Kontext.** Eine Fortsetzung, die mehrere offene Fragen gleichzeitig beantwortet, ist keine
Regieentscheidung, sondern eine Zusammenfassung — und sie ist mit anderen Optionen nicht
vergleichbar.

**Entscheidung.** `ContinuationOption.addresses` ist genau ein `TensionVectorID`.

**Alternativen.**
- *Mehrere adressierte Vektoren* — verworfen: macht Optionen unvergleichbar und die
  Diversitätsprüfung unmöglich.

**Konsequenzen.** (+) Optionen sind vergleichbar, Diversität ist messbar, Begründungen
werden scharf. (−) Fortsetzungen, die tatsächlich zwei Fäden bündeln, müssen als Folge
zweier Panels geplant werden — was dramaturgisch meist ohnehin richtiger ist.
