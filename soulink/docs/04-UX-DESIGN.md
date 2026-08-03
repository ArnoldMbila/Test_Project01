# 04 — UX & Interaktionsdesign (iPad)

## 0. Designthese

Die Oberfläche muss eine Haltung transportieren: **Hier wird Regie geführt,
nicht gewürfelt.** Daraus folgen drei Entwurfsregeln:

1. **Das „Warum“ ist gleichberechtigt sichtbar** — kein Tooltip, kein
   Untermenü, sondern eine feste Zone. Was man versteckt, gilt als unwichtig.
2. **Struktur vor Bild.** Das Board zeigt Panels auch, wenn sie noch kein Bild
   haben. Ein Panel ist eine *Entscheidung*, kein Bildplatzhalter.
3. **Kein „Generate“-Knopf ohne Absicht.** Der primäre Aktionsknopf heißt
   **„Regie führen“** und ist deaktiviert, solange die Aufgabe des Panels
   unklar ist. Der Nutzer erlebt das Prinzip, statt es zu lesen.

---

## 1. Grundlayout — Drei Zonen

```
┌──────────┬──────────────────────────────────────┬─────────────────────┐
│  SPINE   │              CANVAS                  │      INSPECTOR      │
│ (280 pt) │            (flexibel)                │       (360 pt)      │
│          │                                      │                     │
│ Sequenzen│   Board · Sequenz · Graph · Referenz │  WARUM              │
│ Beats    │                                      │  ├ Aufgabe          │
│ Spannungs│   ┌────┐ ┌────┐ ┌────┐               │  ├ Story-Gründe     │
│ kurve    │   │ P1 │→│ P2 │→│ P3 │               │  ├ Kamera-Gründe    │
│ Setups/  │   └────┘ └────┘ └────┘               │  ├ Continuity       │
│ Payoffs  │                                      │  └ Verworfen (mit  │
│          │                                      │     Begründung)     │
│          │                                      │  ─────────────────  │
│          │                                      │  SHOT   (Parameter) │
│          │                                      │  PROMPT (kompiliert)│
└──────────┴──────────────────────────────────────┴─────────────────────┘
                         ▲ Assistant als einziehbares Blatt von unten
```

- **Spine (links):** das Rückgrat der Geschichte. Vertikale Beat-Liste mit
  eingezeichneter Spannungskurve. Offene Setups erscheinen als kleine
  Fahnen — sichtbare Erzählschulden.
- **Canvas (Mitte):** vier Modi (§2), gemeinsame Selektion.
- **Inspector (rechts):** oben immer **WARUM**, darunter erst die Parameter.
  Die Reihenfolge ist eine Wertaussage: Begründung steht über Einstellung.

**Adaptivität:** Bei < 1000 pt Breite (Slide Over, Split View) wird der
Inspector zu einem Overlay, die Spine zu einer Leiste. **Das WARUM-Panel wird
nie als erstes weggekürzt** — bei Platzmangel weicht der Parameterbereich.

---

## 2. Die vier Canvas-Modi

| Modus | Zweck | Kernaktion |
|---|---|---|
| **Board** | Panels als Karten in Beat-Gruppen | Panels anlegen, teilen, umordnen |
| **Sequenz** | horizontale Schnittfolge mit Dauer und Schnittart | Rhythmus prüfen, Übergänge setzen |
| **Graph** | Memory Graph: Figuren, Orte, Motive, Widersprüche | Konsistenz verstehen und reparieren |
| **Referenz** | Referenzbild-Arbeitsplatz (Analyse + Fortsetzungen) | Bild lesen, Fortsetzung wählen |

**Board.** Jede Panelkarte trägt permanent sichtbar: die *eine Aufgabe*
(Textlabel, nicht Icon), Einstellungsgröße als Kürzel, einen
Continuity-Indikator (grün/gelb/rot) und ein Vertrauens-Zeichen. Ein Panel ohne
Aufgabe wird als Umriss mit gestrichelter Kante gezeichnet — visuell
„unfertig“, unabhängig davon, ob schon ein hübsches Bild darinliegt.

**Sequenz.** Zeigt die Schnittfolge als Balken proportional zur geplanten
Dauer, darunter eine Kontrastspur: Wechselt die Einstellungsgröße genug?
Springt die Achse? Drei gleich große Einstellungen hintereinander werden
markiert — nicht verboten, aber sichtbar gemacht („Absicht oder Reflex?“).

**Graph.** Kraftgerichtetes Layout, Filter nach Knotentyp, Zeitregler entlang
der Beats. Beim Ziehen des Reglers verändert sich der Graph — man *sieht*, wie
sich Wissen, Besitz und Beziehungen entwickeln. Widersprüche pulsieren rot.

**Referenz.** Siehe [06](06-REFERENCE-IMAGE-PIPELINE.md) §6.

---

## 3. Der Regie-Flow (Hauptinteraktion)

```
1  Nutzer wählt Beat oder tippt „+ Panel“
2  System fragt: „Welche Aufgabe hat dieses Panel?“
   → Vorschlagsliste aus dem Beat (NarrativeJobs), oder frei formulieren
3  Camera Intelligence schlägt 2–3 ShotSpecs vor
   → Jede Karte: Miniatur-Framing-Skizze + eine Zeile Wirkung + Begründung
4  Nutzer wählt (oder passt an — jede Anpassung fragt nach dem Warum,
   sobald sie eine Grammatikregel verletzt)
5  Continuity Guard meldet: grün / gelb (mit Begründungspflicht) / rot (Veto)
6  Kompilierter Prompt wird angezeigt — lesbar, nicht versteckt
7  „Regie führen“ → Preflight (Kosten sichtbar) → Rendern
8  Ergebnis + Kritik: „Absicht erfüllt? Was fehlt?“
9  Commit ins Gedächtnis oder gezielte Revision (nicht Re-roll)
```

**Der wichtigste Unterschied zur Konkurrenz ist Schritt 9.** Es gibt keinen
„Nochmal“-Knopf, der nur den Seed ändert. Es gibt „**Gezielt überarbeiten**“ —
und dafür muss man benennen, *was* nicht stimmt (Aufgabe verfehlt / Kamera
falsch / Kontinuität verletzt / Ausführung schwach). Nur die letzte Kategorie
ändert allein den Seed, und auch das wird protokolliert. So bleibt selbst der
Zufall eine bewusste Entscheidung.

---

## 4. Der Director Assistant im Interface

Ein von unten einziehbares Blatt (Resizable Sheet), drei Zustände:
Griffleiste / halbe Höhe / voll. **Nie ein Vollbild-Chat** — Regie findet am
Material statt, nicht im Textfenster.

Der Assistant antwortet in **Karten**, nicht in Absätzen:

```
┌───────────────────────────────────────────┐
│ VORSCHLAG A · Der Blick zurück            │
│ Medium Two-Shot, 50 mm, Augenhöhe         │
│ Wirkung: hält beide im selben Raum        │
│ Weil: der Beat verhandelt Nähe, nicht     │
│       Trennung → Trennung im Schnitt      │
│       widerspräche dem Subtext            │
│ Risiko: verliert ihre Mikro-Reaktion      │
│ [ Übernehmen ]  [ Warum genauer? ]        │
└───────────────────────────────────────────┘
```

Der Assistant **widerspricht sichtbar**, wenn eine Nutzeranweisung der
Dramaturgie zuwiderläuft — einmal, klar, mit Alternative. Beharrt der Nutzer,
wird ausgeführt und der Widerspruch im Log vermerkt. Das ist die Rolle eines
guten Kameramanns: einmal warnen, dann die Regie respektieren.

---

## 5. Apple Pencil — kein Zeichenwerkzeug, ein Regiewerkzeug

| Geste | Bedeutung |
|---|---|
| Rahmen aufs Bild zeichnen | Ausschnitt vorschlagen → System leitet Einstellungsgröße/Brennweite ab |
| Pfeil zeichnen | Kamerabewegung oder Figurenbewegung (Auswahl beim Loslassen) |
| Kreis um Bildbereich | „Das ist wichtig“ → wird zu `mustInclude`-Constraint |
| Durchstreichen | „Das raus“ → wird zu `mustAvoid`-Constraint |
| Schnelle Skizze auf leerem Panel | Blocking-Skizze → wird zu `IRStaging` |
| Doppeltipp (Pencil 2) | Umschalten Markieren ↔ Framing |

**Warum das mehr als Deko ist:** Regie ist räumliches Denken. Eine gezeichnete
Blocking-Skizze überträgt Distanz und Blickrichtung präziser als jeder Satz —
und sie wird in typisierte Constraints übersetzt, landet also im gleichen
begründungspflichtigen Pfad wie alles andere.

---

## 6. Weitere iPad-Spezifika

- **Drag & Drop:** Bilder aus Fotos/Dateien direkt auf ein Panel = Referenzbild
  oder Identitätsanker (Abfrage beim Ablegen). Panels lassen sich zwischen
  Beats ziehen; ein Panel in einen fremden Beat zu ziehen löst eine
  Aufgaben-Rückfrage aus, weil sich sein Zweck ändert.
- **Stage Manager / Multi-Window:** Referenzmodus und Board als getrennte
  Fenster — der klassische Arbeitsplatz „links Vorlage, rechts Arbeit“.
- **Tastatur (Magic Keyboard):** `⌘⏎` Regie führen · `⌘W` Warum · `⌘⇧P` Panel
  teilen · `1…4` Modus · `⌥←/→` Panel wechseln · `⌘K` Assistant.
- **Externe Anzeige:** Präsentationsmodus — nur die Sequenz, ohne UI. Für
  Pitches: das Board wird zum Vortrag, das Warum-Panel zur Sprechkarte.
- **Haptik:** deutlicher Impact bei HARD-Veto, weicher Tick bei Warnung. Der
  Körper lernt den Unterschied zwischen „nein“ und „bedenke“ schneller als das Auge.

---

## 7. Zugänglichkeit & Ton

- **Dynamic Type** bis XXL; das WARUM-Panel bleibt vollständig lesbar,
  Parameter werden gekürzt — nicht umgekehrt.
- **VoiceOver:** Panelkarten werden als Satz gelesen:
  „Panel 3, Aufgabe: Bedrohung eskalieren, Nahaufnahme, tiefe Kameraposition,
  Kontinuität geprüft.“ Die Struktur ist damit auch nicht-visuell begreifbar.
- **Reduzierte Bewegung** wird respektiert; der Graph nutzt dann statisches Layout.
- **Farbe ist nie alleiniger Träger:** Continuity-Zustände tragen zusätzlich
  Form und Text (rot ▲ Veto / gelb ● Hinweis / grün ✓ geprüft).
- **Sprache des Systems:** präzise, knapp, ohne Superlative. Kein „amazing shot!“.
  Ein Regieassistent schmeichelt nicht, er begründet. Fehlermeldungen benennen
  Ursache und nächsten Schritt in einem Satz.

---

## 8. Onboarding (erste 10 Minuten)

Kein Feature-Rundgang. Stattdessen **eine geführte Miniszene** (drei Panels):

1. „Worum geht es in dieser Szene — in einem Satz?“ → Prämisse
2. „Was ändert sich darin?“ → der erste Wertumschwung, also der erste Beat
3. System schlägt drei Panels mit je einer Aufgabe vor und **erklärt die
   Reihenfolge** (Etablieren → Konflikt zeigen → Reaktion halten)
4. Der Nutzer ändert eine Einstellungsgröße; das System zeigt sofort die
   veränderte Wirkung und den Continuity-Effekt.

Nach zehn Minuten hat der Nutzer nicht Knöpfe gelernt, sondern **einen Satz
Filmsprache**. Das ist das eigentliche Onboarding-Ziel — und der Grund, warum
Persona P4 (Lernende) ohne Zusatzaufwand mitbedient wird.
