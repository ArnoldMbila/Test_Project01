# 07 — Referenzbild-Analyse & Fortsetzungssynthese

> Das Flaggschiff. Ein Bild rein — sieben Analysestufen — mehrere strategisch verschiedene,
> vollständig begründete Fortsetzungen mit fertigen Prompts und Übergängen.

---

## 1. Die Denkfigur

Ein Bild ist kein Zustand, sondern eine **Frage**. Ein starkes Bild stellt mehrere.

Konventionelle Werkzeuge behandeln ein Referenzbild als Stilvorlage („mehr davon").
SOULINK behandelt es als **dramaturgischen Zwischenstand**: Was ist gerade passiert?
Was steht aus? Welche Kräfte sind im Bild unaufgelöst? Diese unaufgelösten Kräfte sind
`TensionVector`s — und eine Fortsetzung ist immer die Antwort auf genau einen davon.

```
Bild  →  offene Fragen (Vektoren)  →  je Frage mehrere Antwortstrategien  →  Optionen
```

Deshalb sind SOULINK-Optionen nicht austauschbare Varianten, sondern **verschiedene
Regieentscheidungen** — sie beantworten unterschiedliche Fragen oder dieselbe Frage
gegensätzlich.

---

## 2. Die sieben Stufen

| # | Stufe | Frage | Ausgabe | Modell |
|---|---|---|---|---|
| 1 | **Technisch** | Wie ist das Bild gemacht? | Seitenverhältnis, Belichtung, Kontrastumfang, Farbtemperatur, Korn/Rauschen, geschätzte Sensorgröße, Schärfentiefe | Vision |
| 2 | **Kompositorisch** | Wie ist es gebaut? | Bildaufteilung, Ebenen (VG/MG/HG), Linien, Blickführung, Kopf-/Vorderraum, Balance, Negativraum, Symmetrie | Vision |
| 3 | **Kameratechnisch** | Wo steht die Kamera und warum? | Einstellungsgröße, Höhe, Winkel, geschätzte Brennweite, Subjektabstand, implizite Achse, Blickrichtung, implizierte Bewegung | Vision |
| 4 | **Inhaltlich / Kontinuität** | Was ist zu sehen? | Figuren, Kostüm, Requisiten, Ort, Tageszeit, Wetter, Lichtsetup (Führung/Aufhellung/Kante/Praktikables), Zustandsmerkmale | Vision |
| 5 | **Narrativ** | Was erzählt es? | Vorher/Jetzt/Gleich, POV, Machtverhältnis, emotionale Temperatur, Subtext, Beziehung im Bild | Text (auf 1–4) |
| 6 | **Dramaturgisch** | Wo steht es im Bogen? | Vermutete Beat-Funktion, Spannungsniveau, **Spannungsvektoren** mit Belegen | Text |
| 7 | **Synthese** | Was folgt daraus? | Fortsetzungsoptionen je Strategie-Archetyp | Text, je Archetyp ein Aufruf |

### Warum diese Reihenfolge zwingend ist

**1–4 sind Beobachtung, 5–7 sind Deutung.** Die Trennung ist keine Kosmetik: Sie verhindert
den häufigsten Fehler bei Bildanalysen — dass die Deutung die Beobachtung färbt. Wer dem
Modell zuerst die Geschichte erzählt, bekommt die Geschichte im Bild bestätigt, auch wenn
sie nicht drin ist.

Deshalb bekommen Stufen 1–4 **bewusst keinen Story-Kontext** (siehe ADR-007). Sie laufen
parallel und wissen nichts von der Prämisse. Erst Stufe 5 darf deuten, und sie deutet auf
Basis dessen, was tatsächlich gesehen wurde — nachprüfbar, weil jeder Befund aus 1–4 einzeln
im Inspector steht.

### Konfidenz je Stufe

Jede Stufe liefert eigene Konfidenz. Ein Modell kann die Komposition sehr sicher lesen und
die Absicht raten. Eine gemeinsame Zahl würde das verwischen — und alles, was auf einer
geratenen Stufe aufbaut, trüge eine falsche Autorität. Konfidenz < 0,5 in einer Stufe
markiert alle abgeleiteten Aussagen sichtbar.

---

## 3. Spannungsvektoren

Der Kern von Stufe 6. Ein Vektor ist eine **unaufgelöste Kraft mit Bildbeleg**.

| Typ | Bildsignal | Offene Frage |
|---|---|---|
| `offscreenGaze` | Blick verlässt den Rahmen | Wen oder was sieht sie? |
| `concealedObject` | Verdeckte Hand, angeschnittenes Objekt | Was hält sie? |
| `powerImbalance` | Höhendifferenz, Größenverhältnis, Blickrichtung | Wer hat die Kontrolle — und hält das? |
| `approachingThreat` | Bewegungsunschärfe, Schatten, Blickrichtung Dritter | Was kommt? |
| `unspokenRelation` | Zwei Figuren, keine Berührung, kein Blickkontakt | Was liegt zwischen ihnen? |
| `brokenSymmetry` | Gestörte Ordnung im Bild | Was hat das verursacht? |
| `interruptedAction` | Angehaltene Bewegung | Wird sie vollendet? |
| `absentParty` | Zweites Gedeck, leerer Stuhl, zweite Tasse | Wer fehlt? |
| `temporalPressure` | Uhr, Licht am Kippen, brennende Kerze | Wie viel Zeit bleibt? |

Ein Vektor ohne `evidence` (konkreter Bildbeleg) wird vom Rationale Gate verworfen.
„Es liegt Spannung in der Luft" ist kein Vektor.

---

## 4. Der Archetyp-Planer (deterministisch)

Zwischen Vektoren und Optionen sitzt **kein Modell**, sondern Code. Er entscheidet, welche
Strategien am jeweiligen Vektor überhaupt tragen:

```
plan(vectors, beat, arcPosition) → [(vector, archetype, cameraRelation)]
```

Regeln (Auszug aus `strategy-archetypes.yaml`):

| Archetyp | Wirkung | Passt zu Vektoren | Passt **nicht**, wenn |
|---|---|---|---|
| `escalate` | Einsatz erhöhen | approachingThreat, powerImbalance, temporalPressure | Spannung bereits > 0,85 vor dem Klimax |
| `reveal` | Information freigeben | concealedObject, offscreenGaze, absentParty | Die Information trägt einen späteren Beat |
| `reverse` | Verhältnis umdrehen | powerImbalance, unspokenRelation | Kein etabliertes Verhältnis vorhanden |
| `delay` | Antwort verweigern | offscreenGaze, concealedObject | Bereits zwei Verzögerungen in Folge |
| `contrast` | Gegenbewegung, Schnitt woanders hin | alle | Beat-Funktion = climax |
| `approach` | Näher heran, Intimität | unspokenRelation, interruptedAction | Vorgängerpanel war bereits CU |
| `consequence` | Wirkung der Handlung zeigen | interruptedAction, brokenSymmetry | Keine Handlung vorausgegangen |

Der Planer erzeugt außerdem die **Kamerarelationsvorgabe** je Option (Gegenschuss, näher,
weiter, Ortswechsel, POV, Insert) und stellt sicher, dass keine zwei Optionen dieselbe
Kombination aus Archetyp und Relation belegen — die Diversitätsbedingung aus I3, geprüft
*bevor* Modelle laufen.

**Das ist die technische Antwort auf „keine Zufallsergebnisse":** Der Optionsraum wird
konstruiert, nicht gesampelt.

---

## 5. Ausgabe je Option

Jede Option ist eine vollständige `ContinuationOption` (Schema:
[`schemas/continuation-option.schema.json`](../schemas/continuation-option.schema.json)):

1. **Titel** — die Idee in drei Worten
2. **Adressierter Vektor** + warum gerade dieser
3. **Strategie-Archetyp** + Spannungsdelta
4. **Panel-Aufgabe** (genau eine, I1)
5. **Kameraplan** — Absicht, abgeleitete Parameter, Achsenlage, Anschlussprüfung
6. **Kontinuitätsbedingungen** — was gleich bleiben *muss*, mit Herkunft
7. **Übergang** — Typ + Begründung + Brückenelement bei Match Cut
8. **Fertiger Prompt** — gerendert für das aktive Modell, plus die neutrale IR
9. **Risiken** — was das Modell voraussichtlich nicht hält
10. **Rationale** — Wirkung, Belege, verworfene Alternativen

---

## 6. Durchgerechnetes Beispiel

**Referenzbild (Beschreibung):** Halbnahe, Kamera auf Brusthöhe, ca. 50 mm.
Eine Frau Ende 30, nasse Haare, dunkler Mantel, steht im Türrahmen einer Werkstatt.
Draußen Nachtregen, drinnen eine flackernde Neonröhre als einziges Licht von oben-links.
Sie blickt aus dem Bild nach links, an der Kamera vorbei. Ihre rechte Hand ist teilweise
vom Türrahmen verdeckt; darin etwas Metallisches. Im unscharfen Hintergrund rechts:
eine stehende Silhouette, abgewandt.

### Stufen 1–4 (Auszug)

| Stufe | Befund | Konfidenz |
|---|---|---|
| 1 Technisch | 2.39:1 · Kontrastumfang hoch, Lichter am Neon abreißend · Farbtemperatur gemischt (kaltes Neon 5600 K / warmes Praktikables hinten 2800 K) · sichtbares Korn · Schärfentiefe flach | 0,88 |
| 2 Kompositorisch | Figur auf linkem Drittel · Türrahmen als vertikaler Rahmen-im-Rahmen · drei Ebenen (Regen VG / Figur MG / Silhouette HG) · Vorderraum links offen, Kopfraum knapp · gestörte Symmetrie durch Türrahmen | 0,84 |
| 3 Kameratechnisch | Halbnah (MS) · Augenhöhe, minimal darunter · ca. 50 mm · Abstand ~2,5 m · Achse verläuft entlang der Türlinie · Blickrichtung links, aus dem Bild · statisch, kein Bewegungshinweis | 0,79 |
| 4 Inhaltlich | Figur: w., ~35–40, nasse Haare, dunkler Mantel (nass), Wassertropfen · Requisit: metallisches Objekt, verdeckt (Schlüssel/Werkzeug, unsicher) · Ort: Werkstatt, Innen/Außen-Schwelle · Zeit: Nacht · Wetter: Starkregen · Licht: Neon oben-links als Führung, kein Aufheller, schwaches warmes Kantenlicht von hinten rechts · zweite Figur, abgewandt, unscharf | 0,81 |

### Stufe 5 — Narrativ

> **Vorher:** Sie ist durch den Regen gekommen — nicht kurz, sondern durchnässt: eine
> Strecke, keine Distanz.
> **Jetzt:** Sie ist an der Schwelle, nicht drinnen. Der Türrahmen hält sie an der Grenze.
> **Gleich:** Ihr Blick ist bereits woanders als ihr Körper.
> **Machtverhältnis:** Die abgewandte Silhouette hat die stärkere Position — sie muss sich
> nicht umdrehen. Die Kamera steht auf ihrer Seite des Raums.
> **Temperatur:** Kalt, angehalten. Kein Ausbruch, ein Innehalten.
> **Subtext:** Sie ist nicht gekommen, um einzutreten. Sie ist gekommen, um etwas zu Ende zu
> bringen. Das verdeckte Objekt trägt diese Absicht. *(Konfidenz 0,62 — Objekt nicht identifizierbar)*

### Stufe 6 — Dramaturgisch

Vermutete Beat-Funktion: **Komplikation vor der Wendung**. Spannungsniveau ≈ 0,61.

| ID | Vektor | Beleg | Stärke | Offene Frage |
|---|---|---|---|---|
| TV-1 | `offscreenGaze` | Blick verlässt den Rahmen nach links, Vorderraum offen | 0,80 | Was sieht sie, das wir nicht sehen? |
| TV-2 | `concealedObject` | Rechte Hand vom Türrahmen verdeckt, metallischer Reflex | 0,75 | Was hält sie, und wofür? |
| TV-3 | `powerImbalance` | Abgewandte Silhouette im HG, Kamera auf ihrer Seite | 0,66 | Wer von beiden führt diese Szene? |
| TV-4 | `unspokenRelation` | Zwei Figuren, kein Blickkontakt, Türrahmen dazwischen | 0,58 | Was liegt zwischen ihnen? |

### Stufe 7 — Optionsset

Der Planer wählt: TV-1×`delay`, TV-2×`reveal`, TV-3×`reverse`, TV-4×`approach`,
TV-1×`contrast`. Fünf verschiedene Archetypen, fünf verschiedene Kamerarelationen —
Diversitätsbedingung erfüllt.

---

#### Option A — „Was sie sieht, bleibt draußen" · `delay` · Δ +0,09

- **Adressiert:** TV-1 (offscreenGaze)
- **Panel-Aufgabe:** `withhold`
- **Kamera:** Absicht `withhold` → Weite Einstellung von *hinter* ihr, 35 mm,
  Augenhöhe, statisch. Ihr Blickziel bleibt außerhalb des Rahmens, weil die Kamera sich
  auf ihre Schulterlinie legt. Achse gewahrt (Türlinie), Größensprung MS → WS erfüllt.
- **Kontinuität:** Mantel nass · Regen anhaltend · Nacht · Neon oben-links · Silhouette
  weiterhin abgewandt (aus P-ref)
- **Übergang:** Harter Schnitt. *Warum:* Eine Verzögerung braucht einen sauberen Schnitt —
  jede Weichzeichnung würde als Antwort gelesen und die Verweigerung entwerten.
- **Prompt (IR-Auszug):** Subjekt „Frau, dunkler nasser Mantel, nasse Haare, von hinten,
  Schulterlinie" · Handlung „steht in der Tür, Blick nach links, außerhalb des Rahmens" ·
  Kamera „weit, 35 mm, Augenhöhe, statisch, 2.39:1" · Licht „einzelne Neonröhre oben-links,
  hartes Oberlicht, kein Aufheller, warmes Kantenlicht hinten rechts" · Anker
  „nasser dunkler Mantel", „nasse Haare", „flackernde Neonröhre" · Ausschlüsse
  „kein Gegenlicht von links, keine sichtbare zweite Person im Vordergrund"
- **Risiko:** Modelle neigen dazu, das Blickziel zu erfinden. Ausschlussregel verstärkt;
  `FidelityRisk.contentInvention(.medium)`
- **Warum:** Das Bild fragt, wen sie ansieht. Diese Option beantwortet die Frage *nicht* —
  und macht damit die Frage größer. Der Zuschauer sucht mit ihr.
  *Verworfen:* Gegenschuss (hätte die Spannung sofort verbraucht).

#### Option B — „Der Schlüssel" · `reveal` · Δ +0,14

- **Adressiert:** TV-2 (concealedObject)
- **Panel-Aufgabe:** `reveal`
- **Kamera:** Absicht `reveal(FactID)` → Insert, 85 mm, leicht untersichtig,
  Abstand 0,6 m, statisch. Die Untersicht gibt dem Objekt Gewicht, ohne die Figur zu zeigen.
  Achse gewahrt. Größensprung MS → Insert erfüllt; 30°-Regel nicht anwendbar (Insert).
- **Kontinuität:** Hand nass · Regentropfen auf Metall · Neon als Reflexquelle ·
  Ärmel des dunklen Mantels sichtbar
- **Übergang:** Match Cut auf die Handbewegung. *Brücke:* Die Drehung des Handgelenks aus
  dem Referenzbild wird im Insert fortgesetzt. *Warum:* Der Match Cut behauptet
  Gleichzeitigkeit — die Enthüllung geschieht *in* diesem Moment, nicht danach.
- **Risiko:** Objektidentität ist nur zu 0,62 sicher gelesen. Die Option zwingt eine
  Festlegung. Deshalb Warnhinweis: *Diese Option entscheidet etwas, das das Bild offen lässt.*
- **Warum:** Das verdeckte Objekt ist der stärkste unbeantwortete Vektor mit direktem
  Handlungsbezug. Die Enthüllung verwandelt Anwesenheit in Absicht.
  *Verworfen:* Enthüllung in der Totale (das Objekt wäre nicht lesbar gewesen).

#### Option C — „Sie dreht sich um" · `reverse` · Δ +0,18

- **Adressiert:** TV-3 (powerImbalance)
- **Panel-Aufgabe:** `reaction`
- **Kamera:** Absicht `dominance(over:)` invertiert → Gegenschuss auf die Silhouette,
  die sich zur Kamera dreht. Halbnah, 50 mm, Augenhöhe. **Achsenwechsel nötig** —
  gelöst durch die Figurenbewegung selbst (erlaubter Achsenwechsel, R-014), nicht durch
  Kamerasprung.
- **Kontinuität:** Neon als Führung von jetzt oben-rechts (Gegenrichtung) · Regen im HG
  durch die offene Tür sichtbar · Mantelfigur jetzt unscharf im VG
- **Übergang:** Harter Schnitt. *Warum:* Die Umkehrung braucht Härte; jede Überblendung
  würde die Machtverschiebung weich machen.
- **Risiko:** Lichtkontinuität beim Richtungswechsel — Modelle drehen Lichtquellen gern mit.
  Anker „Neonröhre über der Tür, einzige Quelle" verstärkt.
- **Warum:** Das Bild etabliert ein Gefälle zugunsten des Abgewandten. Diese Option nimmt
  ihm den einzigen Vorteil, den er hat: die Abwendung. Wer sich umdreht, muss sich stellen.
  *Verworfen:* Zoom auf die Silhouette (hätte die Machtfrage beobachtet statt beantwortet).

#### Option D — „Die Schwelle" · `approach` · Δ +0,06

- **Adressiert:** TV-4 (unspokenRelation)
- **Panel-Aufgabe:** `state`
- **Kamera:** Absicht `connection(A,B)` → Zweier in der Halbnahen, 40 mm, Augenhöhe,
  langsamer Push-In. **Bewegungsmotivation:** `appliesPressure` — die Kamera nimmt den
  Raum weg, den die Figuren zwischen sich lassen. Achse gewahrt.
- **Kontinuität:** Türrahmen weiterhin trennend · beide im selben Rahmen, keine Berührung ·
  Regen hörbar/sichtbar hinter ihr
- **Übergang:** L-Cut (Ton der neuen Einstellung läuft vor). *Warum:* Beziehung entsteht über
  Zeit, nicht über Schnitt — der Tonvorlauf verbindet, bevor das Bild verbindet.
- **Risiko:** Zwei Figuren im Rahmen ohne Interaktion wirken schnell wie ein Standbild.
  Push-In ist das einzige Bewegungselement — bei Modellen ohne Bewegungsunterstützung
  `FidelityRisk.motionUnsupported(.high)`.
- **Warum:** Die schwächste, aber langfristigste Spannung ist die zwischen den beiden.
  Diese Option investiert statt einzulösen — sie zahlt später.
  *Verworfen:* Getrennte Singles (hätten die Trennung bestätigt statt sie spürbar zu machen).

#### Option E — „Draußen, ohne sie" · `contrast` · Δ −0,12

- **Adressiert:** TV-1, gegenläufig
- **Panel-Aufgabe:** `punctuate`
- **Kamera:** Absicht `observation` → Weite Einstellung der leeren Straße im Regen,
  24 mm, hoch, statisch. Keine Figur im Bild.
- **Kontinuität:** Nacht · Starkregen · dieselbe Straßenlaterne wie im HG des Referenzbildes
- **Übergang:** Harter Schnitt hinein, harter Schnitt hinaus. *Warum:* Ein Atemzug muss
  klar begrenzt sein, sonst wird er zur Leerstelle.
- **Risiko:** Kann als Leerlauf gelesen werden, wenn der folgende Beat nicht sofort greift.
  Nur sinnvoll, wenn Panel n+2 bereits geplant ist.
- **Warum:** Nach 0,61 Spannung braucht die Szene einen Absatz, bevor sie steigt.
  Die leere Straße beantwortet die Blickfrage mit *Abwesenheit* — das ist eine Antwort.
  *Verworfen:* Rückblende (hätte die Gegenwart verlassen, statt sie atmen zu lassen).

---

### Was dieses Beispiel zeigt

Fünf Optionen, fünf **verschiedene Regiehaltungen** — nicht fünf Formulierungen derselben
Idee. Eine verweigert, eine löst ein, eine kehrt um, eine investiert, eine atmet. Δ reicht
von −0,12 bis +0,18. Vier verschiedene Übergangsarten. Vier verschiedene Kamerarelationen.

Das ist kein Ergebnis von Temperatur oder Glück, sondern von der Struktur aus Abschnitt 4.
Man kann es reproduzieren.

---

## 7. Übernahme einer Option

Ein Tap auf *Übernehmen* erzeugt **eine** zusammengesetzte Transaktion im Ledger:

```
AcceptContinuation(optionID)
  ├── CreatePanel(job: option.panelJob)
  ├── LinkBeat(beat, position)
  ├── DeriveCamera(from: option.cameraPlan)      // erneut durch die Grammatik geprüft
  ├── RecordStateChanges(option.continuityConstraints)
  ├── SetTransition(previous → new, option.transition)
  └── ComposePrompt(option.promptIR)
```

Alle Teilschritte teilen dieselbe `Rationale` (Herkunft: die Option) und behalten ihre
eigenen Belege. Scheitert ein Teilschritt an einem Validator, scheitert die ganze
Transaktion — kein halb übernommenes Panel.

Nach der Übernahme läuft **erneut** die Kontinuitätsprüfung über die Nachbarpanels: Eine
Fortsetzung, die für sich stimmig ist, kann eine bestehende Folge brechen.

---

## 8. Grenzen und ehrlicher Umgang damit

| Grenze | Umgang |
|---|---|
| Objektidentität im Bild unsicher | Option markiert ausdrücklich: „entscheidet etwas, das das Bild offen lässt" |
| Kein Story-Kontext vorhanden | Optionen werden erzeugt, aber `groundingWeakness` markiert; der Assistant fragt nach dem Spine |
| Bild ist stilistisch extrem (Grafik, Abstraktion) | Kamerastufe liefert niedrige Konfidenz; das System sagt das, statt Brennweiten zu erfinden |
| Weniger als 3 tragfähige Archetypen | Es werden weniger Optionen gezeigt — mit Begründung, welche Strategien am Material scheitern |
| Referenzbild ist urheberrechtlich geschützt | Analyse ja, Stilnachahmung nein: SOULINK beschreibt Bildmittel (Licht, Optik, Palette), nicht „im Stil von" ([08](08-QUALITAET-NFR.md)) |
