# 01 — Product Requirements Document

**Produkt:** SOULINK — Director Operating System
**Plattform:** iPad (iPadOS 18+), Apple Pencil, Stage Manager, externer Bildschirm
**Dokumentstatus:** Grundlage für Roadmap-Phase P0

---

## 1. Vision

> SOULINK macht Regie-Intelligenz operierbar. Der Nutzer denkt in Szenen, Bögen und Subtext —
> das System übersetzt das in Filmsprache, hält es konsistent und begründet jeden Schritt.

Der Zielzustand nach P3: Ein Regisseur legt ein Referenzbild oder eine Prämisse vor und
verlässt SOULINK zwei Stunden später mit einem **begründeten Board** — Beats, Panels,
Kameraentscheidungen, Anschlussliste, Übergängen und generierten Bildern, bei dem er zu
jedem einzelnen Frame die Frage „Warum so?" beantwortet bekommt, ohne selbst zu raten.

---

## 2. Problemraum

| # | Problem | Heutiger Schmerz |
|---|---|---|
| P1 | **Zufallsästhetik** | Generatoren liefern schöne Einzelbilder ohne erzählerische Notwendigkeit. Auswahl erfolgt nach Geschmack, nicht nach Funktion. |
| P2 | **Anschlussverlust** | Zwischen zwei Generierungen ändern sich Kleidung, Narben, Lichtstimmung, Tageszeit. Der Zuschauer merkt es sofort; das Tool nie. |
| P3 | **Kamera als Dekoration** | „cinematic, wide angle, dramatic lighting" ist Stilrauschen, keine Kameraentscheidung. Blickachse, Screen Direction und Coverage kommen nicht vor. |
| P4 | **Keine Fortsetzungslogik** | Es gibt kein Konzept von „was folgt daraus". Fortsetzung = neuer Prompt mit ähnlichen Worten. |
| P5 | **Nicht reproduzierbar** | Was gestern funktionierte, lässt sich heute nicht wiederherstellen. Kein Entscheidungsgedächtnis. |
| P6 | **Modell-Lock-in** | Prompt-Wissen ist an ein Modell gebunden. Modellwechsel = Wissensverlust. |
| P7 | **Kein Warum** | Wer das Ergebnis verteidigen muss (vor Kunde, Produzent, Team), hat nichts in der Hand. |

---

## 3. Zielgruppen

| Persona | Kontext | Primärer Job |
|---|---|---|
| **Nora, Regisseurin (Kurzfilm/Serie)** | Bereitet Drehtage vor, muss dem DoP und der Ausstattung erklären, was sie will. | Ein Board bauen, das eine Absicht kommuniziert — inkl. Begründung für die Bildbesprechung. |
| **Kemal, Werbe-/Musikvideoregisseur** | Pitcht gegen zwei andere Regisseure, 4 Tage Zeit. | Aus einem Referenzbild des Kunden schnell mehrere *unterschiedliche* Regieansätze mit Argumentation ableiten. |
| **Iris, Graphic-Novel-Autorin** | Erzählt in Panels, kein Set, keine Crew. | Panelfolgen mit klarer Aufgabe je Panel, konsistenten Figuren über hunderte Panels. |
| **Tarek, Previs/Storyboard-Artist** | Arbeitet zu für größere Produktionen. | Coverage planen, Achsen prüfen, Varianten belegen. |
| **Solo-Creator** | Erzählt allein, ohne Filmausbildung. | Filmsprache lernen, während er arbeitet — das System erklärt, statt nur auszuführen. |

**Nicht Zielgruppe (v1):** Endkunden ohne erzählerische Absicht („mach mir ein cooles Bild"),
VFX-Finishing, animierte Langformproduktion mit Pipeline-Integration.

---

## 4. Jobs-to-be-Done

- **JTBD-1** — *Wenn* ich ein Referenzbild habe, *will ich* mehrere logisch begründete
  Fortsetzungen sehen, *damit ich* eine Regieentscheidung treffen kann statt zu würfeln.
- **JTBD-2** — *Wenn* ich eine Szene plane, *will ich* Beats und ihre Spannungskurve sehen,
  *damit ich* erkenne, wo die Szene durchhängt.
- **JTBD-3** — *Wenn* ich ein Panel setze, *will ich* wissen, welche Kamera seiner Aufgabe
  dient, *damit* Form und Inhalt zusammenfallen.
- **JTBD-4** — *Wenn* ich 80 Panels habe, *will ich*, dass Figur, Kostüm, Licht und Ort
  konsistent bleiben, *damit* niemand aus der Geschichte fällt.
- **JTBD-5** — *Wenn* mich jemand fragt „warum diese Einstellung?", *will ich* eine Antwort
  in einem Satz haben, *damit* ich meine Regie vertreten kann.
- **JTBD-6** — *Wenn* ein besseres Bildmodell erscheint, *will ich* wechseln können,
  *ohne* meine Regie-Arbeit zu verlieren.

---

## 5. Funktionale Anforderungen

Priorisierung: **M** = Muss (v1), **S** = Sollte, **K** = Könnte (später).

### 5.1 Director Engine

| ID | Anforderung | Prio |
|---|---|---|
| FR-DE-01 | Jede Zustandsänderung des Projekts läuft als `Decision` durch das Ledger; der Zustand ist ein Fold über das Ledger. | M |
| FR-DE-02 | Das Rationale Gate lehnt Vorschläge ohne belegtes Warum ab und startet die Reparaturschleife. | M |
| FR-DE-03 | Konflikte zwischen Modulen werden nach fester Rangfolge arbitriert und als `ArbitrationRecord` protokolliert. | M |
| FR-DE-04 | Zeitreise: Der Nutzer kann zu jeder früheren Entscheidung springen und von dort verzweigen (Branching). | S |
| FR-DE-05 | Vergleichsmodus: zwei Zweige derselben Szene nebeneinander, inkl. Diff der Begründungen. | K |

### 5.2 Story Engine

| ID | Anforderung | Prio |
|---|---|---|
| FR-SE-01 | Story-Spine (Prämisse, Thema, dramatische Frage, Protagonistenziel, Antagonismus) als strukturierte Entität. | M |
| FR-SE-02 | Beat-Struktur mit Funktion, Wert-Wechsel (`valueShift`, z. B. Sicherheit → Bedrohung) und Spannungswert. | M |
| FR-SE-03 | Spannungskurve über Szene/Akt visualisiert; Erkennung von Plateaus, Sägezähnen, fehlendem Tiefpunkt. | M |
| FR-SE-04 | Subtext-Feld pro Beat: was gesagt wird vs. was gemeint ist. | M |
| FR-SE-05 | Figurenbögen mit Zustand pro Beat (Wollen/Brauchen/Selbstbild/Kosten). | S |
| FR-SE-06 | Strukturvorlagen austauschbar (Drei-Akt, Fünf-Akt, Kishōtenketsu, Sequenzmodell) — als Daten, nicht als Code. | S |
| FR-SE-07 | Szenen-Diagnose: „Diese Szene hat keinen Wertwechsel" mit konkretem Reparaturvorschlag. | S |

### 5.3 Camera Intelligence

| ID | Anforderung | Prio |
|---|---|---|
| FR-CI-01 | Ableitung von Einstellungsgröße, Höhe, Winkel, Brennweite, Abstand, Bewegung **aus** `CameraIntent`. | M |
| FR-CI-02 | Achsenverwaltung (180°-Regel): Achse pro Szene, Prüfung jedes Schnitts, Warnung bei unmarkiertem Sprung. | M |
| FR-CI-03 | Screen Direction & Eyeline über Panelfolgen konsistent halten. | M |
| FR-CI-04 | Anschlussprüfung Größe/Winkel (30°-Regel, Größensprung) mit Begründung der Warnung. | M |
| FR-CI-05 | Coverage-Planung: aus einer Szene ein Einstellungspaket vorschlagen (Master, OTS, Singles, Insert, Reaction). | S |
| FR-CI-06 | Blocking-Skizze: 2D-Grundriss mit Figurenpositionen, Kamerapositionen und Achse; Pencil-editierbar. | S |
| FR-CI-07 | Optik-Sprache: Brennweite als erzählerische Wahl (Kompression/Isolation vs. Weite/Verlorenheit), nicht als Zahl allein. | M |
| FR-CI-08 | Bewegungsmotivation: jede Kamerabewegung braucht Auslöser (Figur, Enthüllung, Druck) — sonst statisch. | M |

### 5.4 Continuity & Memory Graph

| ID | Anforderung | Prio |
|---|---|---|
| FR-CM-01 | Entitäten (Figur, Ort, Requisit, Kostüm, Lichtsetup, Fahrzeug, Tier) mit stabiler Identität und Beschreibungskanon. | M |
| FR-CM-02 | Zustands-Zeitachse: jede Eigenschaft hat einen Wert *ab* einem Panel (`StateChange`), nicht global. | M |
| FR-CM-03 | Widerspruchserkennung: harte Konflikte (Kostümwechsel ohne Ereignis), weiche (Lichtsprung), zeitliche (Nacht vor Abend). | M |
| FR-CM-04 | Kontinuitätsanker: automatische Auswahl der wenigen Merkmale, die im Prompt *wiederholt* werden müssen. | M |
| FR-CM-05 | Ereignisgetriebene Zustandsänderung: „Regen ab Panel 12" propagiert auf alle folgenden Panels bis Widerruf. | M |
| FR-CM-06 | Figurenreferenzbilder (Character Sheet) als Konditionierungsquelle, wenn das Modell es unterstützt. | S |
| FR-CM-07 | Kontinuitätsbericht als exportierbare Liste für die reale Produktion. | K |

### 5.5 Prompt Composer

| ID | Anforderung | Prio |
|---|---|---|
| FR-PC-01 | Erzeugt `PromptIR`: modellneutrale, strukturierte Repräsentation aller Bildentscheidungen. | M |
| FR-PC-02 | Modell-Renderer übersetzen IR → konkreter Prompt + Parameter; pro Modell ein Adapter. | M |
| FR-PC-03 | Deterministisch: gleiche IR + gleicher Renderer ⇒ byte-identischer Prompt. | M |
| FR-PC-04 | Fähigkeits-Degradation mit `FidelityRisk`-Markierung statt stiller Qualitätsverluste. | M |
| FR-PC-05 | Negativ-/Ausschlussregeln aus Kontinuität und Stil automatisch ableiten. | S |
| FR-PC-06 | Prompt-Diff zwischen zwei Panels sichtbar („was ändert sich, was bleibt Anker"). | S |

### 5.6 Director Assistant

| ID | Anforderung | Prio |
|---|---|---|
| FR-DA-01 | Dialogischer Co-Regisseur mit Zugriff auf den gesamten Projektkontext. | M |
| FR-DA-02 | Kritikmodus: benennt Schwächen (Spannungsplateau, redundantes Panel, unmotivierte Bewegung) mit Reparaturvorschlag. | M |
| FR-DA-03 | Sokratischer Modus: stellt die Frage, statt die Antwort zu geben — abschaltbar. | S |
| FR-DA-04 | Advocatus Diaboli: argumentiert aktiv gegen die gewählte Option. | S |
| FR-DA-05 | Lernmodus: erklärt die angewandte Filmsprachregel mit Beispiel. | S |

### 5.7 Referenzbild & Fortsetzung (Flaggschiff)

| ID | Anforderung | Prio |
|---|---|---|
| FR-RF-01 | Vollständige 7-stufige Analyse (technisch, kompositorisch, kameratechnisch, inhaltlich, narrativ, dramaturgisch, synthetisch). | M |
| FR-RF-02 | Extraktion expliziter Spannungsvektoren aus dem Bild. | M |
| FR-RF-03 | 3–7 Fortsetzungsoptionen, garantiert strategisch verschieden (Diversitätsbedingung I3). | M |
| FR-RF-04 | Je Option: Begründung, Kameralogik, Kontinuitätsbedingungen, Übergangstyp + Übergangsbegründung, fertiger Prompt, Risiko. | M |
| FR-RF-05 | Übernahme einer Option erzeugt Panel + Beat + Kameraentscheidung + Kontinuitätsupdate in einem Schritt. | M |
| FR-RF-06 | Analyse ohne Netz möglich, soweit On-Device-Modelle reichen (degradiert, markiert). | K |

### 5.8 Projekt, Import/Export

| ID | Anforderung | Prio |
|---|---|---|
| FR-PX-01 | Lokale Projektdatei (Paketformat) inkl. Ledger, Assets, Analyseergebnissen. | M |
| FR-PX-02 | Export: Board als PDF mit Begründungsspalte. | M |
| FR-PX-03 | Export: Shotlist als CSV, Kontinuitätsbericht. | S |
| FR-PX-04 | Export: EDL/FCPXML-Gerüst für Schnittvorbereitung. | K |
| FR-PX-05 | iCloud-Sync, Mehrgerät. | K |

---

## 6. Nicht-funktionale Anforderungen (Auszug)

Vollständig in [08-QUALITAET-NFR.md](08-QUALITAET-NFR.md).

| ID | Anforderung |
|---|---|
| NFR-01 | **Reaktivität:** Jede rein deterministische Operation (Grammatikprüfung, Kontinuitätscheck, Prompt-Komposition) < 100 ms auf M-Serie-iPad. |
| NFR-02 | **Antwortzeit Analyse:** Referenzbildanalyse vollständig < 25 s; Teilergebnisse progressiv sichtbar ab < 3 s. |
| NFR-03 | **Reproduzierbarkeit:** 100 % — gleicher Ledger-Cursor + Seed ⇒ identischer Prompt. |
| NFR-04 | **Begründungsquote:** 100 % der persistierten Entscheidungen tragen eine gültige `Rationale`. |
| NFR-05 | **Offline:** Alle Planungs-, Struktur- und Prüffunktionen ohne Netz nutzbar. |
| NFR-06 | **Datenschutz:** Referenzbilder verlassen das Gerät nur bei explizit modellgebundenen Aufrufen; sichtbar markiert. |
| NFR-07 | **Erweiterbarkeit:** Neues Bildmodell integrierbar durch einen Adapter + Deskriptor, ohne Domänenänderung. |
| NFR-08 | **Barrierefreiheit:** Dynamic Type, VoiceOver für alle Begründungen, Bedienung ohne Pencil vollständig möglich. |

---

## 7. Erfolgsmetriken

| Metrik | Definition | Ziel v1 |
|---|---|---|
| **Begründungsquote** | Anteil Entscheidungen mit gültiger Rationale | 100 % (harte Invariante) |
| **Optionsakzeptanz** | Anteil Fortsetzungssets, aus denen der Nutzer eine Option übernimmt (statt neu zu prompten) | ≥ 65 % |
| **Strategiedistanz** | Mittlere paarweise Distanz der Optionen im Strategieraum | ≥ 0,6 (normiert) |
| **Kontinuitätsfehlerrate** | Vom Nutzer nachträglich gemeldete Anschlussfehler je 100 Panels | ≤ 2 |
| **Grammatik-Trefferquote** | Anteil Kameravorschläge, die der Nutzer unverändert übernimmt | ≥ 55 % |
| **Zeit bis Board** | Referenzbild → 12 begründete Panels | ≤ 45 min |
| **Erklärbarkeitstest** | Nutzer kann zu einem zufälligen Panel das Warum in einem Satz nennen | ≥ 90 % Trefferquote |
| **Reproduktionstest** | Wiederherstellung eines Panels aus dem Ledger liefert identischen Prompt | 100 % |

---

## 8. Nicht-Ziele (v1)

- Kein finaler Schnitt, keine Tonmischung, kein Compositing.
- Keine Echtzeit-Kollaboration mehrerer Nutzer (P6 frühestens).
- Keine Nachahmung namentlich genannter lebender Künstler oder geschützter Filmästhetiken.
- Kein automatischer „Film aus einem Satz" — SOULINK verlangt Regieentscheidungen, es ersetzt sie nicht.
- Keine eigene Modelltrainings-Pipeline.

---

## 9. Zentrale Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| **Begründungen wirken generisch** („dramatischer") | Kernversprechen bricht | Nicht-Zirkularitätsprüfung im Rationale Gate; Eval-Set mit Negativbeispielen ([08](08-QUALITAET-NFR.md)) |
| **Optionen sind nur Varianten derselben Idee** | Kernversprechen bricht | Diversitätsbedingung I3, Strategie-Abdeckung statt Sampling |
| **Bildmodell ignoriert Kontinuitätsanker** | Anschlussfehler trotz korrekter Planung | Anker-Priorisierung, Referenzkonditionierung, `FidelityRisk`, Post-Check per VLM |
| **Zu viel Prozess, zu wenig Fluss** | Nutzer empfindet Bürokratie | Progressive Disclosure: Warum immer sichtbar, aber nie blockierend; Schnellpfad „übernehmen" |
| **Latenz der Analyse tötet Rhythmus** | Abbruch | Streaming-Stufen, lokale Vorstufen, Optimistic UI |
| **Modellabhängigkeit trotz Abstraktion** | Lock-in durch die Hintertür | Konformitätstests je Adapter; kein Modellname in der Domäne (Lint-Regel) |
| **Filmsprach-Regelkorpus ist Geschmackssache** | Fachliche Angreifbarkeit | Regeln als versionierte, quellenbelegte Daten mit Herkunftsangabe; überschreibbar pro Projekt |
