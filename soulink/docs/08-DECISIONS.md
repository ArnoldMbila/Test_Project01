# 08 — Architekturentscheidungen (ADRs)

Format je Entscheidung: **Kontext → Entscheidung → Begründung → Verworfene
Alternativen → Konsequenzen.** Dasselbe Muster, das SOULINK von sich selbst
verlangt.

---

## ADR-001 — SOULINK ist ein Compiler, kein Chat über Bilder

**Kontext:** Der naheliegende Aufbau wäre: Nutzer schreibt, LLM formuliert
Prompt, Bildmodell rendert.
**Entscheidung:** Mehrstufige Übersetzung Absicht → Story → Regie → IR → Prompt,
mit Prüfpunkten zwischen den Stufen.
**Begründung:** Nur Stufen erlauben Prüfung, Erklärung, Wiederverwendung und
Determinismus. Ein einstufiger Aufbau kann prinzipiell nicht sagen, *warum*
etwas so aussieht — die Information existiert nirgends.
**Verworfen:** Direkter Prompt-Pass-through (nicht erklärbar); reine
Agentenschleife (nicht reproduzierbar).
**Konsequenz:** Höhere Anfangskomplexität; dafür ist jede Kernanforderung des
Produkts strukturell erfüllt statt nachträglich angeflanscht.

---

## ADR-002 — Determinismus als Grundzustand, Zufall nur protokolliert

**Entscheidung:** Bei gleichem Zustand und gleicher Eingabe entsteht dieselbe
`ShotSpec` und derselbe Prompt. Sampling-Zufall existiert nur im Modell und wird
als Seed gespeichert.
**Begründung:** „Keine Zufallsbilder“ ist nur haltbar, wenn Abweichung
*erklärbar* ist. Fünf protokollierte Größen (IR-Hash, Adapter-, Dialekt-,
Template-Version, Seed) beantworten immer die Frage „warum sieht das anders aus?“.
**Verworfen:** Temperatur-basierte Vielfalt im Regiepfad — sie erzeugt genau die
Beliebigkeit, gegen die das Produkt antritt.
**Konsequenz:** Vielfalt entsteht durch *bewusste* Alternativen (Optionen A/B/C),
nicht durch Rauschen.

---

## ADR-003 — Strikte Adapter-Schicht, Regie kennt kein Modell

**Entscheidung:** L2–L4 dürfen `SoulinkAdapters` nicht importieren; die
Paketstruktur erzwingt es zur Bauzeit.
**Begründung:** Modelle veralten in Monaten. Der bleibende Wert liegt in
Gedächtnis, Grammatik und Begründungen. Wäre modellspezifisches Vokabular in der
Regie verstreut, wäre jeder Modellwechsel ein Umbau.
**Verworfen:** Anbieter-SDK direkt in der Domäne (schnell, aber Lock-in);
„wir abstrahieren später“ (später heißt nie).
**Konsequenz:** Ein Zwischenformat (IR) muss gepflegt werden. Der Preis ist
bezahlt in Form der Metrik „neuer Adapter in unter einem Tag“.

---

## ADR-004 — Begründungspflicht auf Typebene, nicht per Konvention

**Entscheidung:** `RenderRequest` ist ohne `DirectorRationale` und
`ContinuityToken` nicht konstruierbar; kein öffentlicher Memberwise-Init.
**Begründung:** Konventionen erodieren unter Termindruck. Was der Compiler
erzwingt, überlebt.
**Verworfen:** Rationale als optionales Feld; Prüfung nur im Review.
**Konsequenz:** Auch Tests und Prototypen müssen begründen — bewusst so.

---

## ADR-005 — Zustandsmaschine statt freier Agentenschleife

**Entscheidung:** Die Director Engine ruft Agenten in definierten Phasen auf;
Agenten kommunizieren nicht untereinander.
**Begründung:** Nachvollziehbarkeit, harte Kosten-/Zeitbudgets, Abbruchsicherheit,
testbare Übergänge. Agent-zu-Agent-Verhandlung erzeugt emergentes Verhalten —
reizvoll in Demos, unbrauchbar für ein Werkzeug, das seine Entscheidungen
verteidigen können muss.
**Verworfen:** Autonome Multi-Agenten-Kooperation; Einzel-Agent mit vielen Tools
(vermischt Rollen, unklare Verantwortung).
**Konsequenz:** Weniger „magisch“, dafür jederzeit erklärbar und budgetierbar.

---

## ADR-006 — Kameraentscheidungen regelbasiert, LLM nur zur Auswahl

**Entscheidung:** Kandidaten kommen aus der Grammar-KB; ein LLM wählt unter
3–5 Kandidaten und formuliert die Begründung.
**Begründung:** Filmsprache ist ein endliches, gut dokumentiertes Handwerk.
Regeln liefern garantierte Motivationen; ein frei erfindendes LLM liefert
plausible Prosa ohne Deckung. Zudem läuft die Regelbasis offline und kostenlos.
**Verworfen:** LLM erfindet ShotSpecs frei (unbelegt, nicht reproduzierbar);
rein regelbasiert ohne LLM (zu starr für Subtext-Feinheiten).
**Konsequenz:** Die KB-Pflege wird zur Kernaufgabe — genau dort liegt aber auch
das schwer kopierbare Know-how.

---

## ADR-007 — Hybrid: Graph für Fakten, Embeddings für Assoziation

**Entscheidung:** Harte Konsistenz über Graph + SQL; semantische Erinnerung
(„gab es schon ein Bild mit dieser Stimmung?“) über Embeddings.
**Begründung:** Embeddings finden Ähnliches, beweisen aber nichts. Widersprüche
sind Mengenlehre. Beides in einer SQLite-Datei hält Sync und Export einfach.
**Verworfen:** Rein vektorbasiertes Gedächtnis (Konsistenz nicht beweisbar);
reiner Graph (findet keine Motive und Stimmungen).
**Konsequenz:** Zwei Abfragewege, ein Speicher.

---

## ADR-008 — Prompt Composer ohne LLM

**Entscheidung:** Deterministische Templates plus Dialektprofile.
**Begründung:** Ein LLM als letzte Stufe würde den Determinismus aus ADR-002
genau dort zerstören, wo er am meisten wert ist. Templates sind testbar,
diffbar und versionierbar.
**Verworfen:** „Prompt-Verschönerung“ per LLM.
**Konsequenz:** Dialektprofile brauchen Pflege; dafür ist jeder Prompt
erklärbar Zeile für Zeile.

---

## ADR-009 — GRDB/SQLite statt SwiftData

**Entscheidung:** SQLite mit GRDB als Persistenz.
**Begründung:** Rekursive Graphtraversierung, Volltextsuche (FTS5),
kontrollierte Migrationen, ein einzelnes Dateiformat für Export und Sync.
SwiftData bietet keine ausreichende Kontrolle über rekursive Abfragen und
Migrationspfade für ein Datenmodell dieser Form.
**Verworfen:** SwiftData/CoreData (Komfort, aber zu wenig Abfragemacht);
separate Graphdatenbank (zweite Laufzeit auf iPadOS unangemessen).
**Konsequenz:** Mehr Handarbeit im Persistenzcode, volle Kontrolle über das
wichtigste Asset des Produkts.

---

## ADR-010 — Offline-First für alles außer Rendern

**Entscheidung:** Story, Kamera, Continuity und Prompt-Kompilierung laufen
vollständig lokal.
**Begründung:** Regie ist Denkarbeit; sie darf nicht von Netz und Anbieter
abhängen. Nebeneffekt: Datenhoheit über die Projektbibel und deutlich geringere
laufende Kosten.
**Verworfen:** Server-seitiger Regie-Kern (schneller zu bauen, aber macht das
Kernversprechen von fremder Infrastruktur abhängig).
**Konsequenz:** Der Regelkern muss ohne LLM brauchbar sein — was M2 ohnehin fordert.

---

## ADR-011 — Der Mensch führt Regie, das System widerspricht genau einmal

**Entscheidung:** Nutzerentscheidungen stehen in der Konfliktrangordnung über
Dramaturg und Kamera; nur ein Continuity-HARD-Veto überstimmt sie.
**Begründung:** Ein Werkzeug, das den Autor überstimmt, wird abgeschaltet. Ein
Werkzeug, das nie widerspricht, ist wertlos. Ein Widerspruch mit Alternative,
dann Ausführung mit Protokoll — das ist die Rolle eines guten Teams.
**Verworfen:** „Best practice erzwingen“ (bevormundend, erzeugt generische
Bildsprache); vollständige Nachgiebigkeit (kein Mehrwert gegenüber einem
Prompt-Feld).
**Konsequenz:** Überschreibungen sind erlaubt — aber begründungspflichtig und
protokolliert.

---

## ADR-012 — Stil wird beschrieben, nicht geliehen; Herkunft wird markiert

**Entscheidung:** Keine Künstlernamen als Stilkürzel im IR
(`styleContract` verbietet es strukturell); keine Likeness realer Personen ohne
hinterlegte Freigabe; C2PA-Metadaten an jeder Ausgabe.
**Begründung:** Rechtlich sauber, handwerklich besser — ein beschriebener Look
(Kontrast, Palette, Optik, Textur) ist steuerbar und übertragbar, ein
geliehener Name ist eine Blackbox. Herkunftsmetadaten sind Berufsstandard.
**Verworfen:** „Im Stil von X“ als Komfortfunktion.
**Konsequenz:** Look Books müssen echte Bildsprache beschreiben. Das ist mehr
Arbeit — und genau die Arbeit, die aus einem Generator ein Regiewerkzeug macht.
