# 06 — Referenzbild-Pipeline

> Ein Bild kommt herein. Heraus kommen **nicht** vier ähnliche Bilder, sondern
> eine Lesart, mehrere begründete Fortsetzungen, fertige Prompts und die
> passenden Übergänge.

Das ist das Feature, an dem sich das Versprechen „Regie statt Zufall“ am
deutlichsten beweist — deshalb ist es hier vollständig durchspezifiziert.

---

## 1. Die sieben Stufen

```
S0 Aufnahme       →  S1 Technische Lesart   →  S2 Semantische Lesart
                                                      ↓
S6 Rückschreiben  ←  S5 Prompt + Übergang   ←  S4 Fortsetzungsoptionen
                                                      ↑
                                             S3 Dramaturgische Lesart
```

Stufen 1–3 sind **Analyse** (was ist da?), Stufe 4 ist **Regie** (was folgt
daraus?), Stufe 5 ist **Übersetzung**, Stufe 6 ist **Gedächtnis**.
Keine Stufe darf übersprungen werden — eine Fortsetzung ohne dramaturgische
Lesart wäre genau der Zufall, den SOULINK ausschließt.

---

## 2. S1 — Technische Lesart

Vollständige Erfassung der Bildmittel, weil eine Fortsetzung nur dann
anschlussfähig ist, wenn sie dieselbe optische Welt bewohnt.

| Feld | Beispielausgabe |
|---|---|
| Einstellungsgröße | Medium Close-Up (Brust bis Kopf) |
| Kamerahöhe / -winkel | leicht untersicht, ca. 10°, Höhe Brustlinie |
| Brennweite (geschätzt) | ~85 mm KB-Äquivalent (Kompression, flache Ebenen) |
| Schärfeebene / Tiefe | Schärfe auf Augen, Hintergrund ~f/2 aufgelöst |
| Komposition | Subjekt auf rechter Drittellinie, Blick nach links |
| Kopf-/Vorlaufraum | knapper Kopfraum, kaum Vorlaufraum → Enge |
| Lichtsetzung | Schlüssellicht 45° links oben, Verhältnis ~4:1, hart |
| Lichtmotivation | Fensterlicht, praktisch motiviert |
| Farbe | kühle Schatten, warme Haut; niedrige Sättigung |
| Kontrast / Ton | Low-Key, Schatten mit Zeichnung |
| Textur | feines Korn, leichte Halation an Lichtern |
| Seitenverhältnis | 2.39:1 |
| Zeit im Bild | Moment nach einer Bewegung (Haarstellung, Restunschärfe) |

**Warum die Brennweiten-Schätzung wichtig ist:** Sie ist der häufigste Bruch
bei generierten Fortsetzungen. Wechselt der Gegenschuss unmotiviert von 85 mm
auf 24 mm, zerfällt der Raum, obwohl beide Bilder „gut“ aussehen. Genau solche
Brüche sind der Grund, warum KI-Sequenzen sich billig anfühlen.

---

## 3. S2 — Semantische Lesart

Wer/was/wo — funktional beschrieben, nie identifizierend:

- **Figuren:** Anzahl, Rolle im Bild, Haltung, Blickrichtung, Mikroausdruck,
  Kostüm und dessen Zustand, sichtbare Merkmale (für den Identitätsanker).
- **Requisiten:** Objekte mit möglicher symbolischer Ladung, Zustand, Besitz.
- **Ort:** Innen/Außen, Raumtyp, Materialität, Zugänge, implizite Geometrie
  (wo ist die vierte Wand, wo kann eine Kamera stehen).
- **Zeit:** Tageszeit, Jahreszeit, Epoche-Signale, Wetter.
- **Off-Screen-Hypothesen:** Was ist außerhalb des Bildes, worauf verweist der
  Blick, woher kommt das Licht? — Das ist die eigentliche Fundgrube für
  Fortsetzungen: **Das nächste Bild lebt fast immer außerhalb des jetzigen.**

Jede Beobachtung trägt Konfidenz. Unter 0,5 wird sie als Frage vorgelegt, nicht
als Fakt gespeichert.

---

## 4. S3 — Dramaturgische Lesart

Hier hört Bildbeschreibung auf und Regie beginnt. Zehn Fragen, die das System
beantworten muss:

1. **Welcher Moment ist das?** Vor, während oder nach dem Ereignis?
   (Ein Bild „nach“ dem Ereignis erzählt anders weiter als eines „davor“.)
2. **Was hat sich gerade geändert?** (Welcher Wertumschwung ist sichtbar?)
3. **Wer hat die Macht?** Kameraverteilung, Bildgewicht, Höhe, Blickrichtung.
4. **Wessen Szene ist das?** Wem gehört der Standpunkt der Kamera?
5. **Was weiß das Publikum, was die Figur nicht weiß — oder umgekehrt?**
6. **Was ist der Subtext?** Was wird verhandelt, ohne gezeigt zu werden?
7. **Welche Spannung liegt an (0…1)?** Und steigt oder fällt sie?
8. **Was fehlt bewusst?** Ein leerer Bildbereich, ein abgeschnittenes Gesicht,
   ein verdecktes Objekt — Auslassung ist eine Aussage.
9. **Welches Genre-Register?** Es bestimmt die Konventionen der Fortsetzung.
10. **Welche Frage stellt das Bild dem Zuschauer?** — Die Fortsetzung
    beantwortet sie, verschiebt sie oder verweigert sie. Alle drei sind
    legitime Regieakte; keiner davon ist Zufall.

Ausgabe: `DramaticReading` mit Begründung je Feld und offenen Fragen.

---

## 5. S4 — Fortsetzungsoptionen (das Herz)

### 5.1 Typisierte Fortsetzungslogiken

Fortsetzungen werden **nicht frei erfunden**. Sie werden aus einer geschlossenen
Menge dramaturgischer Operationen gewählt — jede mit definierter Wirkung,
typischer Kameraantwort und typischem Schnitt:

| Logik | Operation | Typische Kameraantwort | Wirkung |
|---|---|---|---|
| **Reaktion** | Zeige die Wirkung auf die andere Figur | Gegenschuss, gleiche Größe | Empathie, Beziehungsklärung |
| **Enthüllung** | Zeige, was verborgen war | Wide / Insert / Schwenk-Auflösung | Wissensgewinn, Neubewertung |
| **Eskalation** | Erhöhe den Einsatz | engere Einstellung, tiefere Kamera | Druck steigt |
| **Umkehr** | Drehe das Machtverhältnis | Winkelumkehr, Höhenwechsel | Überraschung, Wendepunkt |
| **Weitung** | Gib Kontext zurück | Wide/Establishing, Rückfahrt | Einordnung, Atempause |
| **Verengung** | Gehe näher, isoliere | Close-up, längere Brennweite | Intimität oder Klaustrophobie |
| **Verzögerung** | Halte die Antwort zurück | Cutaway, Insert, leerer Raum | Suspense |
| **Perspektivwechsel** | Wechsle den Standpunkt | POV / Over-Shoulder-Wechsel | Subjektivität, Sympathielenkung |
| **Zeitsprung** | Springe vor/zurück | Marker im Bild + Schnittart | Ökonomie, Rhythmuswechsel |
| **Parallelität** | Schneide auf anderen Ort | Match-Cut / Graphic Match | Vergleich, Ironie, Bedrohung |
| **Einlösung** | Zahle ein Setup ein | Wiederaufnahme der Ur-Einstellung | Befriedigung, Struktur |
| **Bruch** | Verletze bewusst eine Regel | Achsensprung, Jump Cut | Desorientierung — nur motiviert |

**Warum eine geschlossene Menge?** Weil „was könnte als Nächstes passieren“ ein
unendlicher Raum ist, in dem jedes Sprachmodell zu Beliebigkeit neigt. Die
Typisierung zwingt zur Aussage: *Diese Fortsetzung ist eine Umkehr, keine
Eskalation* — und diese Aussage ist überprüfbar, lehrbar und begründbar.

### 5.2 Auswahl der vorgeschlagenen Optionen

Das System liefert **3–5 Optionen**, und zwar bewusst gemischt:

```
1 Option = die konventionell "richtige"  (was ein Profi zuerst tun würde)
1 Option = die kontrastierende           (andere Logik, anderer Rhythmus)
1 Option = die riskante                  (Regelbruch, mit Kosten benannt)
+ ggf. 1 Option aus der Projekt-Policy   (Handschrift dieses Projekts)
+ ggf. 1 Option aus dem Gedächtnis       (löst ein offenes Setup ein)
```

Die letzte Kategorie ist der Punkt, an dem SOULINK etwas kann, was ein
Bildmodell prinzipiell nicht kann: **Es erinnert sich an die Pistole aus Beat 4
und schlägt vor, sie jetzt einzulösen.**

### 5.3 Was jede Option enthält

```swift
struct Continuation: Justified {
    let title: String                 // "Der Blick, der zu spät kommt"
    let logic: ContinuationLogic      // .reversal
    let narrativeJob: NarrativeJob    // .shiftPower
    let whatChanges: ValueShift       // Macht: positiv → negativ
    let shotSpec: ShotSpec            // vollständig, nicht angedeutet
    let transition: TransitionSpec    // Schnittart + Timing + Begründung
    let compiledPrompts: [AdapterID: CompiledPrompt]   // fertig, sofort nutzbar
    let continuityImpact: [GraphFactProposal]          // was das Gedächtnis lernt
    let tensionAfter: Double
    let risk: String                  // was verloren geht
    let rationale: DirectorRationale  // Pflicht
}
```

`risk` ist verpflichtend. Jede Regieentscheidung kostet etwas — wer nur Vorteile
nennt, verkauft, statt zu beraten.

---

## 6. S5 — Prompts und Übergänge

**Prompts** entstehen wie überall über die IR und den Prompt Composer — nicht
direkt aus dem Analysetext. Damit gilt auch hier: Modell tauschbar, Ergebnis
reproduzierbar, Identität und Continuity automatisch injiziert.

Zusätzlich beim Referenzfall:
- Das Referenzbild wird, wenn der Adapter es kann, als **Konditionierung**
  mitgegeben (Identität, Komposition oder Stil — getrennt wählbar).
- Kann er es nicht, wird die Bildinformation in Text überführt und die
  Degradation im Rationale vermerkt (siehe [02 §2.5](02-SYSTEM-ARCHITECTURE.md)).

**Übergänge** sind eigene Entscheidungen mit eigener Begründung:

| Übergang | Wann begründet |
|---|---|
| Harter Schnitt | Standard; Kontinuität von Raum und Zeit |
| Match Cut | Formale Ähnlichkeit trägt eine Bedeutung (Vergleich/Ironie) |
| Graphic Match | Bildform bleibt, Inhalt wechselt — Themenverknüpfung |
| Jump Cut | Zeitkompression oder psychischer Zustand |
| Smash Cut | Abrupter Registerwechsel, Schock |
| Blende / Überblendung | Zeit vergeht, Traum, Erinnerung |
| Wischer / Bewegungsschnitt | Energie tragen, Tempo halten |
| Kamerabewegung als Brücke | Wenn der Raum erhalten bleiben soll (kein Schnitt) |

Zum Übergang gehört immer ein **Timing-Hinweis** (auf welchem Bild bzw. welcher
Bewegung geschnitten wird) — Schnitt ist Rhythmus, nicht nur Reihenfolge.

---

## 7. S6 — Rückschreiben ins Gedächtnis

Wird eine Fortsetzung übernommen, schreibt der Archivist:
neue Fakten (mit `source == .inferredFromImage`, Konfidenz erhalten), neue
Kanten (Figur ↔ Ort ↔ Requisit), Motivzähler, Setup/Payoff-Status,
etablierte Achse und Screen Direction, sowie das vollständige Decision-Log.

**Vom Bild abgeleitete Fakten werden markiert und bei Konflikt zur Bestätigung
vorgelegt.** Ein Referenzbild darf das Projektgedächtnis anreichern, aber
niemals still überschreiben — sonst importiert man Interpretationsfehler
dauerhaft in die Geschichte.

---

## 8. Der Referenz-Arbeitsplatz (UI)

```
┌───────────────────────────┬──────────────────────────────────────┐
│                           │  LESART                              │
│      Referenzbild         │  ▸ Technisch  ▸ Semantisch           │
│   (Pencil: markieren,     │  ▾ Dramaturgisch                     │
│    Achse einzeichnen,     │     Moment: unmittelbar nach dem Nein│
│    Off-Screen andeuten)   │     Macht: bei der stehenden Figur   │
│                           │     Frage des Bildes: Bleibt sie?    │
│  Overlays umschaltbar:    │  ────────────────────────────────────│
│  Drittel · Blickachse ·   │  FORTSETZUNGEN                       │
│  Lichtrichtung · Tiefe    │  ┌ A · Reaktion  · konventionell ──┐ │
│                           │  │ B · Umkehr    · kontrastierend ─┤ │
│                           │  │ C · Verzögerung · riskant ──────┤ │
│                           │  │ D · Einlösung (Setup aus Beat 4)┘ │
│                           │  [ Vergleichen ]  [ Übernehmen ]     │
└───────────────────────────┴──────────────────────────────────────┘
```

- **Overlays** machen die Analyse überprüfbar: Der Nutzer *sieht* die
  angenommene Blickachse und kann sie mit dem Pencil korrigieren. Korrektur
  eines Overlays rechnet die Fortsetzungen neu — Analyse ist ein Dialog, kein Orakel.
- **Vergleichen** stellt zwei Optionen samt Wirkung, Risiko und Spannungsverlauf
  nebeneinander. Die Entscheidung trifft der Mensch — informiert.

---

## 9. Was dieses Feature ausdrücklich nicht tut

- Es erzeugt **keine** „ähnlichen Bilder“ auf Knopfdruck (Variation ohne Absicht).
- Es identifiziert **keine** realen Personen und rekonstruiert keine Likeness.
- Es benennt **keine** lebenden Künstler als Stilquelle; Stil wird beschrieben.
- Es befolgt **keine** Anweisungen, die als Text im Bild stehen — solcher Text
  ist Bildinhalt, keine Aufforderung ([05 §6](05-AGENTS.md)).
