# EWIGE KRISE — Rundenbasiertes RPG

Ein browserbasiertes, rundenbasiertes Fantasy-RPG mit Active-Time-Battle-System,
inspiriert von der Kampfmechanik moderner Mobile-JRPGs. Alle Charaktere,
Namen, Sprites und Inhalte sind Eigenkreationen — die fünf Helden basieren
auf eigenen Character-Design-Sheets, sämtliche Sprites werden zur Laufzeit
prozedural aus Pixel-Maps generiert (keine externen Assets, keine Abhängigkeiten).

![Titelbildschirm](screenshots/titel.png)
![Kampf](screenshots/kampf.png)

## Spielen

Einfach `index.html` im Browser öffnen — kein Build, kein Server nötig.

```bash
# optional mit lokalem Server:
cd ewige-krise
python3 -m http.server 8080
# → http://localhost:8080
```

## Spielablauf

1. **Gruppe wählen** — 3 von 5 Helden
2. **Kapitel wählen** — 3 Kapitel, jeweils 3 Wellen mit Boss am Ende
3. **Kämpfen** — Sieg bringt EP, Gold, Items und schaltet das nächste Kapitel frei

Der Fortschritt (Level, EP, Gold, Items, freigeschaltete Kapitel) wird
automatisch im `localStorage` gespeichert.

## Kampfsystem (ATB im Warte-Modus)

- **ATB-Leiste** füllt sich in Echtzeit abhängig vom Tempo-Wert; ist sie voll,
  darf die Einheit handeln. Solange ein Befehlsmenü offen ist, pausiert die Zeit.
- **Befehle:** Angriff (lädt MP auf), Fähigkeiten (kosten MP), Items,
  Verteidigen (halbiert Schaden, lädt MP), Limit.
- **Bruch-Leiste:** Jeder Treffer füllt die orangene Leiste des Gegners —
  Treffer auf **Schwächen** deutlich stärker. Ist sie voll, ist der Gegner
  **erschüttert**: Er kann nicht handeln und erleidet +50 % Schaden.
- **Limit-Leiste:** Füllt sich durch ausgeteilten und erlittenen Schaden.
  Bei 100 % steht die Limit-Technik des Helden bereit.
- **Elemente:** Physisch, Feuer, Blitz, Erde, Licht, Schatten —
  mit Schwächen (×1,5) und Resistenzen (×0,5) pro Gegner.
- **Boss-Aufladungen:** Bosse telegrafieren schwere Angriffe eine Runde
  vorher (⚠) — Zeit zum Verteidigen oder Heilen.

## Die fünf Helden

| Held | Rolle | Design-Vorlage | Limit |
|------|-------|----------------|-------|
| **Kaiser Aurel** | Wächter (Tank) | Herrscher mit Lorbeerkranz, Goldrüstung, weiße Robe | Imperium Lux |
| **Prophet Elior** | Seher (Heiler) | Alter Prophet, grauer Bart, dunkle Robe | Posaunenschall |
| **Seraph** | Klinge (Magier) | Weißes Lockenhaar, glühende Augen, Schwert der Wahrheit | Klinge der Wahrheit |
| **Kade** | Schatten (Schnelle DPS) | Junger Mann im schwarzen Mantel | Nachtsturm |
| **Malik** | Brecher (Bruch-Spezialist) | Kämpfer mit Dreadlocks, ganz in Schwarz | Titanenfaust |

## Projektstruktur

```
ewige-krise/
├── index.html       — Bildschirme (Titel, Gruppe, Kapitel, Kampf, Ergebnis)
├── style.css        — komplettes Styling
└── src/
    ├── sprites.js   — Sprite-Engine: Pixel-Maps → Canvas (inkl. Spiegelung, Blitz-Silhouetten)
    ├── data.js      — Helden, Fähigkeiten, Limits, Gegner, Kapitel, Items
    ├── battle.js    — ATB-Kampf-Engine, Animationen, Rendering
    └── main.js      — Bildschirm-Logik, Befehlsmenüs, HUD, Speicherstand
```

## Technik

- Pures HTML/CSS/JavaScript, keine Bibliotheken
- Sprites: Pixel-Maps (Zeichen → Palettenfarbe), gerendert auf Canvas mit
  `image-rendering: pixelated`; automatisch generierte gespiegelte und
  weiße (Treffer-Blitz-)Varianten
- Kampf-Rendering auf einem 960×540-Canvas, UI als DOM-Overlay
- Responsive bis hinunter zu Mobilgeräten
