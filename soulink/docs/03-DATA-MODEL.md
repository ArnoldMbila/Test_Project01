# 03 — Datenmodelle

Leitsatz: **Die Datentypen sind die Architektur.** Wenn ein ungültiger
Regiezustand nicht *darstellbar* ist, kann er nicht entstehen.

---

## 1. Kernentitäten (Übersicht)

```
Project
 ├─ Bible            (Prämisse, Thema, Ton, Regeln, Look Book, DirectorPolicy)
 ├─ Entity*          (Character | Location | Prop | Costume | Vehicle | Motif)
 ├─ Sequence*
 │   └─ Beat*        (Wertumschwung, Subtext, Tension, NarrativeJob)
 │       └─ Panel*   (genau eine Aufgabe)
 │           ├─ ShotSpec        (Kamera/Licht/Komposition + Motivation)
 │           ├─ DirectorIR      (modellfreie Zwischenrepräsentation)
 │           ├─ Generation*     (Prompt, Adapter, Seed, Asset, Kritik)
 │           └─ DirectorRationale
 ├─ MemoryGraph      (Knoten + Kanten + Fakten mit Gültigkeitsbereich)
 └─ DecisionLog*     (jede Entscheidung, append-only)
```

---

## 2. Regie-Begründung — der Typ, der alles zusammenhält

```swift
struct DirectorRationale: Codable, Hashable {
    let intent: String                 // Was soll dieses Bild bewirken?
    let narrativeJob: NarrativeJob     // Die EINE Aufgabe
    let becauseStory: [Justification]  // Story-Gründe (Beat-Referenzen)
    let becauseCamera: [Justification] // Kamera-Gründe (KB-Regel-Referenzen)
    let becauseContinuity: [Justification]
    let rejectedAlternatives: [RejectedOption]   // Pflicht: min. 1
    let confidence: Confidence         // low | medium | high
    let openQuestions: [String]        // Wo das System unsicher ist
    let authoredBy: DecisionAuthor     // .system(module) | .user | .userOverride
}

struct Justification: Codable, Hashable {
    let claim: String            // "Tele komprimiert den Raum hinter ihr"
    let sourceRef: SourceRef     // .grammarRule("compression.isolation.v1")
                                 // .beat(id) | .graphFact(id) | .userStatement
    let strength: Strength       // .principle | .convention | .heuristic
}

struct RejectedOption: Codable, Hashable {
    let option: String           // "Close-up statt Wide"
    let wouldAchieve: String     // "mehr Intimität"
    let rejectedBecause: String  // "zerstört die eben etablierte Geografie"
}
```

**Warum `rejectedAlternatives` Pflicht ist:** Eine Begründung ohne Alternative
ist eine Behauptung. Regie ist Auswahl. Erst der Vergleich macht die
Entscheidung überprüfbar — für den Nutzer und für die Evaluation.

`Strength` unterscheidet Prinzip (Blickachse), Konvention (Schuss/Gegenschuss)
und Heuristik (Policy-Präferenz). Nur Prinzipien darf der Guard hart erzwingen;
Heuristiken sind Vorschläge. Ohne diese Unterscheidung wird das System
dogmatisch — und Dogma ist das Gegenteil von Regie.

---

## 3. Story-Ebene

```swift
struct Beat: Identifiable, Codable {
    let id: BeatID
    var title: String
    var sequenceID: SequenceID
    var order: Int

    var valueShift: ValueShift      // Kern: was ändert sich?
    var carriers: [EntityID]        // Wer trägt den Umschwung?
    var tension: Double             // 0…1, kuratiert oder vom Bogen abgeleitet
    var subtext: Subtext            // Gesagtes vs. Gemeintes
    var narrativeJobs: [NarrativeJob]  // → wird auf Panels verteilt
    var setups: [SetupID]           // hier gepflanzt
    var payoffs: [SetupID]          // hier eingelöst
    var timeMarker: TimeMarker?     // absolut/relativ, für Continuity
}

struct ValueShift: Codable {
    let axis: ValueAxis   // .safetyDanger, .connectionIsolation, .powerless…
    let from: Polarity    // .positive | .neutral | .negative
    let to: Polarity
}                          // from == to ⇒ Validierungsfehler: "kein Beat"

struct Subtext: Codable {
    let surface: String    // was gezeigt/gesagt wird
    let beneath: String    // was wirklich verhandelt wird
    let visibleTo: Audience// .audienceOnly | .characterOnly | .both | .neither
}
```

`visibleTo` ist die formale Grundlage für Suspense vs. Überraschung: Weiß das
Publikum mehr als die Figur, ist Suspense möglich — und die Kamera darf/soll
das Wissen bebildern (Insert auf die Waffe unter dem Tisch). Diese Unterscheidung
ist keine Prosa, sie ist ein Feld, das Camera Intelligence liest.

```swift
struct Panel: Identifiable, Codable {
    let id: PanelID
    let beatID: BeatID
    var order: Int
    var narrativeJob: NarrativeJob        // GENAU EINE — nicht optional, kein Array
    var shotSpec: ShotSpec?
    var status: PanelStatus               // .planned .specified .rendered .locked
    var lockedReason: String?             // gesperrt = Regie ist entschieden
}
```

---

## 4. Regie-/Kamera-Ebene

```swift
struct ShotSpec: Codable, Hashable {
    var size: ShotSize             // .extremeWide … .extremeCloseUp, .insert
    var angle: CameraAngle         // .eyeLevel .low .high .dutch(Double) .overhead
    var height: CameraHeight
    var lens: LensSpec             // focalLengthEq, aperture, distortionPolicy
    var focus: FocusSpec           // depthOfField, rackFocus?, focusSubject
    var movement: MovementSpec     // type, motivation (PFLICHT bei ≠ .static), speed
    var composition: CompositionSpec
    var lighting: LightingSpec     // key, ratio, direction, quality, motivation
    var color: ColorSpec
    var continuityRefs: ContinuityRefs  // Achse, Screen Direction, Eyeline
    var transitionIn: TransitionSpec    // Schnittart zum Vorgänger + Grund
    var motivation: CameraMotivation    // PFLICHT: Verweis in die Grammar-KB
}

struct MovementSpec: Codable, Hashable {
    let type: MovementType   // .static .pan .tilt .dolly .truck .crane .handheld .steadicam .zoom
    let motivation: String?  // nil NUR erlaubt, wenn type == .static
    let speed: Speed
    let motivatedBy: MotivationSource? // .characterMovement .revealTiming .subjectivity
}
```

**Warum Bewegung ohne Motivation verboten ist:** Eine Kamerafahrt, die nichts
enthüllt und niemandem folgt, ist Dekoration. Der Typ macht Dekoration zu einem
Kompilierfehler-Äquivalent (Validierung schlägt fehl).

```swift
struct CompositionSpec: Codable, Hashable {
    let framingRule: FramingRule    // .thirds .centered .symmetry .goldenRatio .negativeSpace
    let subjectPlacement: [SubjectPlacement]  // wer wo, mit welchem Bildgewicht
    let headroom: Headroom
    let leadRoom: LeadRoom?         // Blick-/Bewegungsraum — Richtung ist Continuity
    let depthLayers: [DepthLayer]   // Vorder-/Mittel-/Hintergrund: was steht wofür
    let eyelineDirection: ScreenDirection?
}
```
`depthLayers` zwingt zur Entscheidung, was der Vordergrund *bedeutet*
(Verdeckung = Voyeurismus/Bedrohung, Rahmung = Gefangensein). Ohne dieses Feld
entstehen flache Bilder mit hübschem Bokeh.

---

## 5. DirectorIR — die modellfreie Zwischenrepräsentation

Der Vertrag zwischen Regie und Modellwelt. **Enthält keinen einzigen
modellspezifischen Begriff** (kein „--ar“, kein „cfg“, kein „masterpiece“).

```swift
struct DirectorIR: Codable, Hashable {
    let version: SemanticVersion
    let subjects: [IRSubject]         // Identität + Zustand + Kostüm + Emotion
    let staging: IRStaging            // Blocking, Distanzen, Blickrichtungen
    let environment: IREnvironment     // Ort, Tageszeit, Wetter, Zustand des Raums
    let camera: IRCamera               // aus ShotSpec, aber normalisiert
    let light: IRLight
    let palette: IRPalette
    let mood: IRMood                   // Tension, emotionale Temperatur, Genre-Register
    let styleContract: IRStyle         // Look-Book-Referenz, KEIN Künstlername
    let mustInclude: [IRConstraint]    // aus Continuity: harte Bildfakten
    let mustAvoid:   [IRConstraint]    // z.B. "keine sichtbare Wunde rechts"
    let references: [IRReference]      // Identitätsanker, Stilanker, Kompositionsanker
    let aspect: AspectRatio
    let irHash: String                 // Inhaltshash ⇒ Cache & Reproduzierbarkeit
}
```

**Nutzen der IR, konkret:**
- Ein Modellwechsel erzeugt aus derselben IR einen anderen Prompt — die
  *Regie* ist identisch. Vergleichbarkeit von Modellen wird damit erst möglich.
- `irHash` erlaubt Caching und beantwortet die Frage „hat sich die Absicht
  geändert oder nur das Modell?“ — die Kernfrage bei jedem Re-render.
- `styleContract` verbietet strukturell Künstlernamen als Stil-Shortcut
  (rechtlich und handwerklich richtig: Stil wird beschrieben, nicht geliehen).

---

## 6. Memory Graph

### 6.1 Knoten

| Typ | Beispielattribute |
|---|---|
| `Character` | Rolle, Ziel, Hindernis, Bogen, IdentityAnchor, feste vs. wandelbare Merkmale |
| `Location` | Geometrie-Notizen, Lichtverhalten, Zugänge, etablierte Blickachsen |
| `Prop` | Zustand, Besitzer, symbolische Ladung |
| `Costume` | Zustandsstufen (sauber → zerrissen), gültig ab Beat |
| `Motif` | visuelles Motiv, Bedeutung, bisherige Auftritte |
| `Setup` | gepflanzt in Beat, eingelöst in Beat (offen = Schuld des Systems) |
| `Beat`, `Panel`, `Generation` | Verweise in die Erzähl-/Produktionsebene |
| `Rule` | projektspezifische Regel („Der Antagonist wird nie zentriert“) |

### 6.2 Kanten

```
appears_in, wears, carries, located_at, owns, knows_about, believes,
relationship_to(type, valence), follows(beat→beat), foreshadows(setup→payoff),
callback_of, mirrors, contradicts, established_by(fact→panel), replaced_by
```

### 6.3 Fakten mit Gültigkeitsbereich — der entscheidende Kniff

```swift
struct GraphFact: Identifiable, Codable {
    let id: FactID
    let subject: NodeID
    let predicate: Predicate
    let object: FactValue
    let validFrom: BeatID          // ab wann wahr
    let validUntil: BeatID?        // nil = bis auf Weiteres
    let establishedBy: PanelID?    // wo im Bild etabliert
    let confidence: Double
    let source: FactSource         // .userStated .inferredFromImage .systemDerived
}
```

**Warum Zeitgültigkeit statt schlichter Attribute:** Figuren *verändern* sich —
das ist der ganze Punkt von Erzählung. Ein Modell mit „Mantel: ja/nein“ kann
nur Zustände, keine Geschichte. Mit `validFrom/validUntil` kann der Guard
korrekt urteilen: „In Beat 9 trägt sie den Mantel noch nicht — hier ist er ein
Fehler, ab Beat 12 ein Muss.“ Das ist der Unterschied zwischen einer Datenbank
und einem *Gedächtnis*.

`source` trennt Nutzerwissen von Bildinterpretation. Aus einem Bild abgeleitete
Fakten haben niedrigere Priorität und werden bei Konflikt zur Bestätigung
vorgelegt, statt still zu überschreiben.

### 6.4 Abfragen, die der Guard braucht

```sql
-- Alle harten Bildfakten für Figur X zum Zeitpunkt von Beat B
-- Offene Setups (Payoff fehlt) vor dem Finale
-- Etablierte Achsenseite für Ort L seit dem letzten Establishing Shot
-- Motiv-Häufigkeit im Fenster der letzten N Panels (Ermüdungsprüfung)
-- Widerspruchssuche: Fakten mit gleichem (subject, predicate), überlappender Gültigkeit
```
Die letzte Abfrage ist die eigentliche Continuity-Prüfung — sie ist reine
Mengenlehre, kein KI-Rätselraten. Deshalb ist sie zuverlässig.

---

## 7. Generierung & Reproduzierbarkeit

```swift
struct Generation: Identifiable, Codable {
    let id: GenerationID
    let panelID: PanelID
    let irHash: String
    let adapterID: AdapterID
    let adapterVersion: String
    let dialectVersion: String
    let promptTemplateVersion: String
    let compiledPrompt: CompiledPrompt     // positiv, negativ, Parameter
    let seed: UInt64                       // IMMER protokolliert
    let assetRef: AssetRef
    let cost: Cost
    let critique: Critique?
    let createdAt: Date
    let supersedes: GenerationID?          // Versionskette, nichts wird gelöscht
}
```

**Reproduzierbarkeitsvertrag:** Gleiche (`irHash`, `adapterVersion`,
`dialectVersion`, `promptTemplateVersion`, `seed`) ⇒ gleicher Prompt, und bei
deterministischen Adaptern gleiches Bild. Weicht ein Ergebnis ab, kann das
System **benennen, welche der fünf Größen sich geändert hat**. Genau das
unterscheidet Regie von Glücksspiel.

Nichts wird gelöscht: verworfene Generationen bleiben mit Grund erhalten
(`supersedes`-Kette). Ein Regisseur, der seine verworfenen Takes nicht mehr
findet, hat kein Archiv, sondern ein Leck.

---

## 8. Entscheidungsprotokoll

```swift
struct DecisionLogEntry: Identifiable, Codable {
    let id: UUID
    let timestamp: Date
    let phase: EngineState              // FRAME, CAMERA, CONTINUITY_CHECK …
    let module: ModuleID
    let inputsDigest: String            // Hash der Eingaben
    let decision: String
    let rationale: DirectorRationale?
    let vetoes: [ContinuityVeto]
    let overriddenByUser: Bool
    let userJustification: String?      // Pflicht bei Override eines SOFT-Warnings
}
```
Append-only. Es ist gleichzeitig Audit-Trail, Undo-Grundlage, Lehrmaterial
(„zeig mir, wie du auf diese Sequenz gekommen bist“) und Datenquelle für die
Evaluation in [10](10-QUALITY-AND-EVAL.md).

---

## 9. Persistenz & Migration

- **Speicher:** eine SQLite-Datei pro Projekt im `.soulink`-Paket
  (+ `assets/`, + `bible.json` im Klartext für Diff/Review/Git).
- **Migrationen:** nummerierte GRDB-Migrationen; jede IR-Version bleibt lesbar
  (`DirectorIR.version`), alte Generationen werden nie invalidiert.
- **Export:** `.soulink`-Paket (vollständig), Shotliste (CSV/PDF),
  Prompt-Paket (JSON, adapterneutral = IR + kompilierte Prompts), Board (PDF).
- **Sync:** CloudKit, opt-in, konfliktarm durch append-only Log und
  Last-Writer-Wins nur auf editierbaren Feldern (Beats/Bible), nie auf Log/Generationen.
