# 09 — Filmsprache-Wissensbasis (Grammar-KB)

> Die KB ist der Ort, an dem SOULINK sein Handwerk hält. Sie ist **Daten,
> keine Programmlogik** — versioniert, diffbar, erweiterbar, auditierbar.

Warum das entscheidend ist: Wäre Filmsprache in Swift-Code gegossen, könnte man
sie weder prüfen noch erweitern noch begründen. Als Datei kann jede Regel im
Inspector zitiert werden („weil Regel `isolation.compression.v1`“), im Review
diskutiert und projektspezifisch überschrieben werden.

---

## 1. Aufbau

```
soulink/knowledge/
  grammar/
    shot-sizes.yaml         Einstellungsgrößen und ihre Wirkung
    angles.yaml             Winkel, Höhe, Machtverhältnis
    lenses.yaml             Brennweite, Kompression, Verzerrung, Nähe
    movement.yaml           Bewegungstypen und ihre Motivationen
    composition.yaml        Rahmung, Bildgewicht, Tiefe, Blickführung
    lighting.yaml           Schlüssel, Verhältnis, Richtung, Qualität
    color.yaml              Paletten, Temperatur, Sättigungspolitik
    editing.yaml            Schnittarten, Rhythmus, Anschlussregeln
    rules.yaml              Harte Anschlussregeln (Achse, Blick, Richtung)
    mappings.yaml           NarrativeJob → Kandidatenfamilien  ← Kernstück
    genres/                 Register-Overlays (Noir, Doku, Komödie, …)
```

Jede Datei trägt `schemaVersion` und jede Regel eine stabile `id`. IDs werden
nie wiederverwendet — sonst würden alte Begründungen im Archiv falsch.

---

## 2. Das Kernstück: `mappings.yaml`

Es beantwortet die Frage, an der alles hängt: *Welche Bildsprache erfüllt diese
erzählerische Aufgabe?*

```yaml
- job: isolate_character
  intent: "Die Figur ist allein — auch wenn Menschen um sie herum sind."
  candidates:
    - id: isolation.wide_negative_space.v1
      shotSize: wide
      lens: { focalEq: 35, note: "Raum bleibt lesbar" }
      composition:
        framingRule: negativeSpace
        subjectWeight: small
        placement: offCenter
      effect: "Der leere Raum wird zum Gegenspieler."
      strength: principle
      bestWhen: { tension: [0.2, 0.6], powerState: low }
      avoidWhen: ["Geografie ist unbekannt"]   # dann erst etablieren
      costs: "Mikro-Mimik geht verloren."

    - id: isolation.compression.v1
      shotSize: mediumCloseUp
      lens: { focalEq: 135, note: "Hintergrund kollabiert" }
      composition: { framingRule: centered, depthLayers: flattened }
      effect: "Die Welt hinter ihr wird zur undurchdringlichen Wand."
      strength: convention
      bestWhen: { tension: [0.5, 0.9] }
      costs: "Raumbezug schwindet — nicht direkt nach einem Ortswechsel."

    - id: isolation.foreground_obstruction.v1
      shotSize: medium
      composition:
        depthLayers: [ { layer: foreground, role: obstruction } ]
      effect: "Wir sehen sie durch etwas hindurch — Distanz wird körperlich."
      strength: heuristic
      bestWhen: { subtext: observed }
      costs: "Kann als Zufall gelesen werden, wenn nicht wiederholt."
```

**Was jede Kandidatenregel liefern muss:** `effect` (die Wirkung in einem Satz),
`strength` (Prinzip/Konvention/Heuristik), `bestWhen`, `avoidWhen` und `costs`.
Ohne `costs` gibt es keine ehrliche Abwägung — und ohne Abwägung keine Regie.

---

## 3. Harte Anschlussregeln — `rules.yaml`

Diese Regeln sind nicht Stil, sondern räumliche Buchführung. Sie werden vom
Continuity Guard geprüft, nicht vom Cinematographer vorgeschlagen.

```yaml
- id: continuity.axis.180.v1
  kind: hard
  statement: "Kamerapositionen bleiben auf einer Seite der Handlungsachse."
  violationEffect: "Figuren tauschen scheinbar die Seiten; Raum bricht zusammen."
  allowedBreak:
    requiresMotivation: true
    validMotivations:
      - "Bruch markiert Loyalitäts-/Wahrheitswechsel"
      - "Kamera überquert die Achse sichtbar in derselben Einstellung"
      - "neutrale Einstellung auf der Achse als Brücke"
- id: continuity.eyeline.v1
  kind: hard
  statement: "Blickrichtungen im Gegenschuss müssen sich treffen."
- id: continuity.screen_direction.v1
  kind: hard
  statement: "Reisebewegung behält ihre Bildrichtung, bis ein Grund sie ändert."
- id: editing.30degree.v1
  kind: soft
  statement: "Zwischen zwei Einstellungen desselben Motivs ≥ 30° Positionswechsel."
  violationEffect: "Wirkt wie ein Fehler statt wie ein Schnitt (Jump Cut)."
- id: editing.size_contrast.v1
  kind: soft
  statement: "Aufeinanderfolgende Einstellungen unterscheiden sich in der Größe."
```

**Regelbruch ist vorgesehen, nicht verboten.** `allowedBreak` macht aus einer
Verletzung eine begründbare Entscheidung. Genau daran erkennt man ein
Regiesystem statt einer Checkliste: Es kennt die Regel *und* ihren sinnvollen Bruch.

---

## 4. Rhythmus — `editing.yaml`

Schnitt ist Zeit, nicht nur Reihenfolge. Die KB hält deshalb:

- **Schnittarten** mit Bedeutung und Voraussetzung (siehe [06 §6](06-REFERENCE-IMAGE-PIPELINE.md))
- **Rhythmusprofile**: Wie verhält sich die Einstellungsdauer zur Spannung?
  (z. B. „Beschleunigung zur Eskalation“, „Retardierung vor der Enthüllung“)
- **Kontrastregeln**: Größenwechsel, Achsenwechsel, Bewegungswechsel
- **Ermüdungsschwellen**: Wie oft darf eine Einstellungsfamilie in N Panels
  wiederkehren, bevor sie stumpf wird?

Diese Werte speisen die Bewertungsfunktion aus
[02 §2.3](02-SYSTEM-ARCHITECTURE.md) — deshalb schlägt SOULINK nicht dreimal
hintereinander die „beste“ Einstellung vor. Die beste Einstellung wird durch
Wiederholung zur schlechtesten.

---

## 5. Genre-Overlays

Ein Overlay verändert Gewichte, nicht Regeln:

```yaml
genre: noir
weights:
  lighting.lowKey: +0.4
  lighting.hardShadow: +0.3
  composition.foreground_obstruction: +0.3
  angle.dutch: +0.15
  color.saturation.low: +0.25
conventions:
  - id: noir.venetianBlinds.v1
    caution: "Klischeegefahr — nur einsetzen, wenn motiviert (Ort hat Jalousien)."
```

`caution` ist bewusst Teil der Daten: Das System kennt seine eigenen Klischees
und benennt sie, statt sie reflexhaft zu bedienen.

---

## 6. Projektspezifische Regeln

Ein Projekt darf die KB erweitern und überschreiben (`Rule`-Knoten im Memory
Graph, siehe [03 §6.1](03-DATA-MODEL.md)):

```
"Der Antagonist wird nie zentriert — bis zur Szene 41."
"Keine Handkamera vor dem zweiten Akt."
"Rot erscheint ausschließlich bei Lügen."
```

Solche Regeln sind der eigentliche Beweis, dass SOULINK *Handschrift* zulässt.
Sie werden vom Guard geprüft wie jede andere Regel — inklusive des Moments,
in dem sie planmäßig gebrochen werden (Szene 41 als eingelöstes Versprechen).

---

## 7. Pflege und Qualitätssicherung der KB

- **Schema-Validierung** in CI: jede Regel braucht `effect`, `strength`, `costs`.
- **Verweis-Integrität:** Begründungen dürfen nur existierende IDs zitieren;
  ein Test durchsucht Decision-Logs nach toten Verweisen.
- **Abdeckungstest:** Für jeden `NarrativeJob` müssen ≥ 3 Kandidaten mit
  unterschiedlicher Wirkung existieren — sonst kann das System nicht wählen,
  und ohne Wahl gibt es keine Begründung.
- **Herkunft:** Regeln werden als Handwerkswissen formuliert und beschrieben,
  nicht aus urheberrechtlich geschützten Texten übernommen. Beispiele verweisen
  auf Wirkung, nicht auf konkrete geschützte Werke.
