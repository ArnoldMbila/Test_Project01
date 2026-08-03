# 02 — Systemarchitektur

## 0. Die zentrale Idee: SOULINK ist ein Compiler, kein Chatbot

Ein Chatbot schickt Text an ein Modell und hofft. Ein Compiler übersetzt in
klar definierten Stufen von einer hohen in eine niedrige Repräsentation und
kann bei jeder Stufe prüfen, optimieren und **erklären**.

```
Absicht          →  Story-Ebene      →  Regie-Ebene    →  IR            →  Zielsprache
(Nutzer, Bild)      Beat, Konflikt,     ShotSpec,         DirectorIR       Prompt für
                    Subtext             Kamera, Licht     (modellfrei)     Modell X
   Frontend             Middle-End                            Backend
```

Daraus folgt alles Weitere:

- **Keine Zufallsbilder**, weil jede Stufe deterministisch aus der vorherigen
  folgt (ADR-002). Zufall existiert nur als *protokollierter Seed*.
- **Modelle austauschbar**, weil ausschließlich das Backend modellbewusst ist
  (ADR-003). Die Regie kennt kein einziges Modell.
- **Erklärbarkeit**, weil jede Stufe ihre Eingaben, Regeln und Ausgaben
  protokolliert (ADR-004).

---

## 1. Schichtenmodell

```
┌──────────────────────────────────────────────────────────────────────┐
│  L6  PRESENTATION — SwiftUI / iPadOS                                 │
│      Board · Spine · Inspector · Graph · Assistant · Pencil-Overlays  │
├──────────────────────────────────────────────────────────────────────┤
│  L5  DIRECTOR ASSISTANT — Dialog, Rückfragen, Vorschlagsdarstellung   │
│      (übersetzt Nutzerabsicht ⇄ typisierte Regie-Objekte)             │
├──────────────────────────────────────────────────────────────────────┤
│  L4  DIRECTOR ENGINE — Orchestrator (Zustandsmaschine, kein Free-Run) │
│      Policy · Entscheidungsprotokoll · Veto-Handling · Kritik-Schleife │
├──────────────────────────────────────────────────────────────────────┤
│  L3  REASONING MODULES                                               │
│      Story Engine │ Camera Intelligence │ Continuity Guard │ Critic    │
├──────────────────────────────────────────────────────────────────────┤
│  L2  KNOWLEDGE                                                        │
│      Film-Grammar-KB (Daten) │ Memory Graph │ Projekt-Bibel │ Look Book │
├──────────────────────────────────────────────────────────────────────┤
│  L1  COMPOSITION — Prompt Composer: DirectorIR → Modell-Dialekt        │
├──────────────────────────────────────────────────────────────────────┤
│  L0  PROVIDER ADAPTERS — Bild · Video · Vision · LLM · Embeddings      │
├──────────────────────────────────────────────────────────────────────┤
│      PERSISTENZ — SQLite/GRDB · Dateien · CloudKit (opt-in) · Cache    │
└──────────────────────────────────────────────────────────────────────┘
```

**Abhängigkeitsregel:** Abhängigkeiten zeigen ausschließlich nach unten,
und L2–L4 dürfen L0 **nicht** kennen. Die Regie darf nicht wissen, welches
Modell rendert — sonst beginnt sie, für ein Modell zu schreiben, und die
Austauschbarkeit ist verloren.

---

## 2. Module im Detail

### 2.1 Director Engine (L4) — der Regisseur

**Verantwortung:** Sie entscheidet nicht selbst über Kamera oder Story. Sie
**führt Regie über die Module**: Sie bestimmt Reihenfolge, löst Konflikte,
erzwingt Invarianten und protokolliert.

Implementiert als **explizite Zustandsmaschine**, nicht als frei laufende
Agentenschleife (ADR-005 — Begründung: Nachvollziehbarkeit, Kostenkontrolle,
Abbruchsicherheit):

```
INTAKE → FRAME → DRAMATURGY → CONTINUITY_CHECK → CAMERA → COMPOSE
       → PREFLIGHT → RENDER → CRITIQUE → COMMIT
                       ↑                    │
                       └──── REVISE (max n) ┘
```

| Zustand | Frage, die beantwortet wird | Fehlschlag führt zu |
|---|---|---|
| INTAKE | Was will der Nutzer wirklich? | Rückfrage über Assistant |
| FRAME | Welche Aufgabe hat dieses Panel? (genau eine) | „Panel überladen“ → Split-Vorschlag |
| DRAMATURGY | Wo im Bogen stehen wir, was ist Subtext? | Story Engine fragt nach |
| CONTINUITY_CHECK | Widerspricht das dem Gedächtnis? | **Veto** (hart) oder Warnung (weich) |
| CAMERA | Welche Bildsprache erfüllt die Aufgabe? | Kein Kandidat → Grammatiklücke melden |
| COMPOSE | Wie lautet der Prompt für Modell X? | Adapter-Capability fehlt → Degradation |
| PREFLIGHT | Kosten, Rechte, Policy, Kapazität ok? | Abbruch mit Grund |
| RENDER | Ausführung | Retry-Policy, Fallback-Adapter |
| CRITIQUE | Erfüllt das Ergebnis die Absicht? | REVISE mit *gezielter* Änderung |
| COMMIT | In Memory Graph schreiben | — |

**Harte Invariante (Typ-Ebene):**

```swift
// Ein RenderRequest ist ohne Rationale nicht konstruierbar.
struct RenderRequest {
    let ir: DirectorIR
    let rationale: DirectorRationale     // kein Optional, kein Default
    let continuityToken: ContinuityToken // nur vom Guard ausgestellt
    // kein öffentlicher Memberwise-Init: nur über DirectorEngine.compile()
}
```

Damit ist „Jede Entscheidung braucht ein klares Warum“ keine Konvention,
sondern vom Compiler erzwungen. Ein Entwickler *kann* die Regel nicht umgehen,
ohne den Typ zu ändern — und das fällt im Review auf.

**Director Policy** — konfigurierbares Regie-Temperament (pro Projekt):
Schnittfrequenz, Kamerabewegungs-Neigung, Nähe-Bereitschaft, Symmetrie-Hang,
Regelbruch-Toleranz. Zwei Projekte mit gleicher Story, unterschiedlicher
Policy ⇒ unterschiedliche, aber jeweils begründete Bildsprache. Die Policy ist
der „Handschrift“-Regler des Systems.

---

### 2.2 Story Engine (L3) — die Dramaturgie

**Hält:** Prämisse, Thema, Figurenziele/-hindernisse, Konfliktachsen,
Spannungskurve, Beats, Setups & Payoffs, Subtext-Register.

**Modell:** Beats sind die Atome. Ein Beat ist eine **Zustandsänderung**, kein
Ereignis. Wenn sich nichts ändert (Wert, Wissen, Macht, Beziehung), ist es
kein Beat — und rechtfertigt keinen eigenen Shot.

```
Beat = (vorherZustand → nachherZustand, Wertumschwung, Träger, Subtext)
```

**Wertumschwung (value shift):** jeder Beat trägt eine Polarität
(z. B. Sicherheit → Bedrohung, Nähe → Distanz, Wissen → Zweifel). Das ist die
Schnittstelle zur Camera Intelligence: Die Kamera bebildert nicht das
Ereignis, sondern **den Umschwung**.

**Spannungskurve:** normalisierte Tension-Werte 0…1 pro Beat, plus
Struktur-Overlay (wählbar: Drei-Akt, Fünf-Akt, Kishōtenketsu, Sequenz-Modell).
Die Struktur ist Daten, kein Code — andere Erzähltraditionen sind nachrüstbar.

**Ausgabe an die Engine:** `NarrativeJob` — die *eine* Aufgabe des nächsten
Panels, z. B.:
`establish_geography`, `reveal_information`, `escalate_threat`,
`show_reaction`, `withhold_information`, `mislead`, `pay_off_setup`,
`isolate_character`, `shift_power`, `mark_time_passage`, `close_beat`.

Diese Liste ist die verbindliche Nahtstelle: **Camera Intelligence akzeptiert
ausschließlich `NarrativeJob`-Werte als Eingabe** — nie freien Text. Damit ist
strukturell unmöglich, dass eine Kamera ohne erzählerischen Zweck entsteht.

---

### 2.3 Camera Intelligence (L3) — die Bildsprache

**Verantwortung:** `NarrativeJob` + Kontext (Tension, Figurenmacht, Raum,
Policy, vorheriger Shot) → `ShotSpec` **mit Begründung**.

Kein Modell rät hier. Der Kern ist eine **regelbasierte Kandidatensuche über
die Film-Grammar-KB** (siehe [09](09-FILM-GRAMMAR.md)), ein LLM wird nur zur
Feinbeurteilung knapper Kandidaten eingesetzt (ADR-006):

```
1. Kandidaten holen:   KB.rules(for: job, tension: t, powerState: p)
2. Hart filtern:       Continuity-Constraints (Achse, Blickrichtung, Raumlogik)
3. Bewerten:           score = Zweckerfüllung
                             + Kontrast zum vorherigen Shot   (Rhythmus)
                             + Policy-Passung                 (Handschrift)
                             − Wiederholungsstrafe            (Ermüdung)
                             − Regelbruchkosten               (falls unmotiviert)
4. Top-k an LLM:       „Welcher Kandidat trägt den Subtext am besten? Warum?“
5. Ergebnis:           ShotSpec + Rationale + verworfene Alternativen mit Grund
```

Schritt 5 ist entscheidend: **Auch die verworfenen Optionen werden gespeichert
und angezeigt.** Regie ist die Kunst des begründeten Weglassens; ein System,
das nur das Ergebnis zeigt, lehrt nichts und ist nicht prüfbar.

`ShotSpec` umfasst: Einstellungsgröße, Winkel, Höhe, Brennweite, Blende/Schärfe,
Bewegung (Typ, Motivation, Geschwindigkeit), Komposition (Regel, Blickachse,
Kopf-/Vorlaufraum, Bildgewicht), Licht (Schlüssel, Verhältnis, Richtung,
Qualität, Motivation), Farbe (Palette, Temperatur, Sättigungspolitik),
Anschluss (Achsenseite, Screen Direction, Schnittart zum Vorgänger).

**Achsen- und Anschlussregeln** werden als Constraints geführt, nicht als
Stiltipps. Ein Achsensprung ist erlaubt — aber nur mit eingetragener
Motivation („Bruch markiert Loyalitätswechsel“). Unmotivierter Achsensprung =
Warnung des Continuity Guard.

---

### 2.4 Continuity & Memory Graph (L2/L3) — das Gedächtnis

**Zwei Teile:**

1. **Memory Graph** — der Speicher (Struktur in [03](03-DATA-MODEL.md)).
2. **Continuity Guard** — der Wächter mit **Vetorecht** vor jeder Generierung.

Der Guard prüft in drei Härtegraden:

| Grad | Beispiel | Verhalten |
|---|---|---|
| **HARD** | Figur trägt Narbe links, Prompt sagt rechts; Figur ist tot; Ort hat keine Fenster | **Veto** — Render blockiert, Korrekturvorschlag |
| **SOFT** | Achsensprung ohne Motivation; Tageszeit springt ohne Marker | Warnung + „trotzdem, weil …“-Feld (Pflichtbegründung) |
| **INFO** | Motiv „Regen“ zum vierten Mal — Absicht oder Reflex? | Hinweis im Inspector |

**Warum ein Graph und nicht nur Text-Embeddings:** Konsistenz ist eine Frage
*harter Fakten* („trägt seit Beat 12 den Mantel des Bruders“), nicht der
semantischen Ähnlichkeit. Embeddings finden Ähnliches, Graphen beweisen
Widersprüche. SOULINK nutzt beides: Graph für Constraints, Embeddings für
Assoziation und Motivsuche (Hybrid, ADR-007).

**Identitätsverankerung** (damit Figuren wirklich gleich aussehen):
Jede Figur besitzt ein `IdentityAnchor` — kanonische Referenzbilder,
Merkmalsliste (unveränderlich vs. veränderlich), optional Embedding/LoRA-Handle
je Adapter. Der Prompt Composer injiziert Identität **immer**, unabhängig davon,
ob der Nutzer die Figur erwähnt hat.

---

### 2.5 Prompt Composer (L1) — der Codegenerator

**Verantwortung:** `DirectorIR` → modellspezifischer Prompt + Parameter.
Deterministisch, template-basiert, testbar. **Kein LLM im Hauptpfad**
(ADR-008): Ein LLM, das Prompts frei formuliert, macht dieselbe Ausgabe morgen
anders — das bricht die Reproduzierbarkeit.

```
DirectorIR ──► [ Dialekt-Profil des Adapters ] ──► Prompt
                        │
                        ├─ Vokabular-Mapping (IR-Term → Modell-Term)
                        ├─ Ordnungspolitik (was zuerst gewichtet wird)
                        ├─ Negativ-Politik (was das Modell notorisch falsch macht)
                        ├─ Parameter-Mapping (Seitenverhältnis, Steps, CFG, Seed)
                        └─ Capability-Degradation (was das Modell nicht kann)
```

**Capability-Degradation, sauber gelöst:** Kann ein Modell keine
Referenzbild-Konditionierung, so *fällt die Absicht nicht weg* — sie wird in
Text übersetzt, und die Degradation wird im Rationale vermerkt
(„Identität nur textuell gesichert; Konsistenzrisiko erhöht“). Der Nutzer sieht
also, *warum* das Ergebnis schwächer ist, statt es dem Zufall zuzuschreiben.

Jeder Prompt wird zusammen mit `promptTemplateVersion`, `irHash` und `seed`
gespeichert ⇒ vollständige Reproduzierbarkeit.

---

### 2.6 Director Assistant (L5) — der Gesprächspartner

**Nicht** ein Chatfenster über der App, sondern die Übersetzungsschicht
zwischen natürlicher Sprache und den typisierten Regie-Objekten.

Vier Gesprächsakte:
- **Klären** — „Ist der Streit der Beat oder das Schweigen danach?“
- **Vorschlagen** — immer ≥ 2 Optionen, immer mit Begründung und Konsequenz.
- **Widersprechen** — „Drei Close-ups hintereinander lösen die Geografie auf.
  Wenn du die Enge willst, funktioniert ein Two-Shot mit Tele besser, weil …“
- **Erklären** — jederzeit „Warum?“ auf jedes Artefakt.

Der Assistant hat **keine Schreibrechte** auf den Memory Graph. Er formuliert
Absichten; committen darf nur die Director Engine nach Continuity-Prüfung.
Damit kann ein Missverständnis im Dialog niemals das Projektgedächtnis
verschmutzen.

---

## 3. Provider-Adapter-Schicht (L0) — Austauschbarkeit als Pflicht

Fünf Protokolle, alle modellagnostisch formuliert:

```swift
protocol ImageGenerationAdapter {
    var id: AdapterID { get }
    var capabilities: AdapterCapabilities { get }   // deklarativ, abfragbar
    var dialect: PromptDialect { get }              // Vokabular + Politik
    func render(_ request: AdapterRequest) async throws -> AdapterResult
    func estimateCost(_ request: AdapterRequest) -> CostEstimate
}
protocol VideoGenerationAdapter { /* + Bewegung, Dauer, Start/Endframe */ }
protocol VisionAnalysisAdapter  { /* Referenzbild-Analyse            */ }
protocol ReasoningAdapter       { /* LLM: Dramaturgie, Bewertung      */ }
protocol EmbeddingAdapter       { /* Semantische Erinnerung           */ }
```

`AdapterCapabilities` deklariert u. a.: Referenzbild-Konditionierung,
Identitäts-/Charakter-Konsistenz, Inpainting, ControlNet-artige Steuerung,
maximale Auflösung, unterstützte Seitenverhältnisse, Seed-Determinismus,
Prompt-Längenlimit, Content-Policy-Strenge.

**Regel:** Neue Modelle werden hinzugefügt durch (1) eine Adapter-Klasse und
(2) ein Dialekt-Profil als Datei — **ohne eine Zeile in L2–L4 zu ändern**.
Das ist der Akzeptanztest für die Austauschbarkeit (Metrik in
[01 §7](01-PRD.md)) und wird in CI durch einen „Fake-Adapter“-Test bewacht.

**Lokale Modelle:** Ein `CoreMLAdapter` ist vorgesehen (Apple Silicon,
On-Device). Architektonisch identisch — nur ein weiterer Adapter. Damit ist
Offline-Rendern und Datenschutz-Betrieb ein Konfigurations-, kein Umbauthema.

---

## 4. Datenflüsse

### 4.1 Standardfluss „nächster Shot“

```
Nutzerabsicht
   │  Assistant: Klärung, falls Absicht mehrdeutig
   ▼
Story Engine ── Beat + NarrativeJob + Tension + Subtext ──┐
   │                                                      │
Memory Graph ── Fakten, Constraints, Identitäten ─────────┤
   │                                                      ▼
   └──────────────────────────► Camera Intelligence → ShotSpec (+ Alternativen)
                                        │
                                Continuity Guard  ── HARD-Veto? → zurück
                                        │
                                 DirectorIR (modellfrei)
                                        │
                                 Prompt Composer → Prompt(Adapter X)
                                        │
                                 Preflight (Kosten/Policy/Rechte)
                                        │
                                     Adapter → Bild
                                        │
                                 Regie-Kritiker: Absicht erfüllt?
                                        │
                                 Commit in Memory Graph (+ Rationale, Seed, Hashes)
```

### 4.2 Referenzbildfluss
Siehe [06 — Referenzbild-Pipeline](06-REFERENCE-IMAGE-PIPELINE.md).

---

## 5. Technologiewahl (iPad)

| Bereich | Wahl | Begründung |
|---|---|---|
| UI | SwiftUI (iPadOS 18+), UIKit-Interop punktuell | Adaptive Layouts, Pencil, Drag&Drop, Stage Manager ohne Eigenbau |
| Canvas | Metal-gestützte Custom-Layer für Board & Graph | Hunderte Panels + Verbindungen bleiben flüssig; SwiftUI allein bricht bei großen Graphen ein |
| Nebenläufigkeit | Swift 6 Concurrency, strikte Isolation | Regie-Kern als Actor ⇒ keine Race-Conditions im Entscheidungsprotokoll |
| Persistenz | SQLite via GRDB | Graphabfragen, Volltext (FTS5), Migrationen, Transaktionen — SwiftData ist für rekursive Graphtraversierung zu schwach (ADR-009) |
| Vektoren | sqlite-vec / eigene Cosine-Suche | keine zweite Datenbank, alles in einer Datei = einfacher Sync & Export |
| Sync | CloudKit (opt-in), Datei-basiert (`.soulink`-Paket) | Datenhoheit; Export als Paket ermöglicht Teamübergabe ohne Cloud |
| Netzwerk | URLSession + Adapter-eigene SDK-freie Clients | Vermeidet Anbieter-SDKs im Kern (Lock-in-Risiko) |
| Bildhaltung | Dateien im App-Container + Thumbnails-Cache | DB bleibt klein und sync-fähig |

**Modularisierung als Swift Packages** (erzwingt die Abhängigkeitsregel
technisch, nicht nur per Konvention):

```
SoulinkKernel      (Domänentypen, IR, Rationale — keine Abhängigkeiten)
SoulinkStory       → Kernel
SoulinkCamera      → Kernel, SoulinkGrammar
SoulinkGrammar     → Kernel        (KB-Lader + Regelauswertung)
SoulinkMemory      → Kernel        (Graph, Persistenz)
SoulinkCompose     → Kernel        (Prompt Composer, Dialekte)
SoulinkAdapters    → Kernel, SoulinkCompose
SoulinkDirector    → alle obigen   (Engine/Orchestrator)
SoulinkUI          → SoulinkDirector
```
`SoulinkStory`, `SoulinkCamera` und `SoulinkMemory` dürfen `SoulinkAdapters`
nicht importieren — der Build bricht, wenn es jemand versucht. Genau so wird
aus einem Architekturprinzip eine überprüfbare Tatsache.

---

## 6. Fehler-, Kosten- und Offline-Verhalten

- **Offline:** Story, Kamera, Continuity, Prompt-Kompilierung laufen vollständig
  lokal. Nur `RENDER` braucht Netz (außer bei CoreML-Adapter). Das System
  bleibt also auch im Flugzeug ein Regiewerkzeug — nur ohne Bilder.
- **Kosten:** `estimateCost` vor jedem Batch; Budget pro Projekt einstellbar;
  Überschreitung erzeugt Rückfrage, keinen stillen Abbruch.
- **Fehler:** Adapterausfall → Fallback-Adapter mit protokollierter
  Degradation; nie stiller Modellwechsel (das Ergebnis sähe sonst grundlos
  anders aus — genau der Zufall, den SOULINK ausschließt).
- **Abbruch:** Jede Engine-Phase ist abbrechbar und hinterlässt konsistenten
  Zustand (Zwischenergebnisse als Draft, nie halb committet).
