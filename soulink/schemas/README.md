# Schemata

Die drei Verträge, an denen das ganze System hängt. Sie sind bewusst als JSON Schema
formuliert und nicht nur als Swift-Typen, weil sie **zwei** Aufgaben erfüllen:

1. **Persistenzvertrag** — was im Ledger und im Projektpaket landet.
2. **Agentenvertrag** — Modelle antworten gegen genau diese Schemata; ungültige Antworten
   gehen in die Reparaturschleife ([05-AGENTEN.md](../docs/05-AGENTEN.md) §5), statt
   durchgewinkt zu werden.

| Datei | Vertrag | Invariante |
|---|---|---|
| [`rationale.schema.json`](rationale.schema.json) | Das Warum jeder Entscheidung | I4 — kein Warum, kein Artefakt |
| [`continuation-option.schema.json`](continuation-option.schema.json) | Die begründete Fortsetzung | I3 — keine Fortsetzung ohne Dramaturgie |
| [`prompt-ir.schema.json`](prompt-ir.schema.json) | Die modellneutrale Bildbeschreibung | I5 + I6 — Determinismus und Austauschbarkeit |

## Bemerkenswerte Schemaentscheidungen

- **`grounds` ist typisiert, nicht Freitext.** Nur so ist Belegbarkeit maschinell prüfbar.
  Ein Beleg, der auf einen nicht existierenden Beat zeigt, fällt durch das Gate.
- **`addresses` ist ein einzelner Vektor, kein Array** (ADR-012). Das macht Optionen
  vergleichbar und die Diversitätsprüfung überhaupt erst möglich.
- **`movement.motivation` ist Pflicht.** Eine Kamerabewegung ohne Motivation ist nicht
  darstellbar; der Verfremdungsfall (`intentionalUnmotivated`) kostet eine Zweckangabe.
- **`bridge` ist bei `matchCut` bedingt Pflicht** (`allOf`/`if`/`then`). Ein Match Cut ohne
  benanntes Brückenelement ist kein Match Cut.
- **`anchors` trägt `phrase` wörtlich.** Wortgleichheit über Panels hinweg ist hier
  Kontinuitätstechnik, kein Stilfehler.
- **`provenance` ist Pflicht in der IR.** Ohne sie ist ein erzeugtes Bild nicht erklärbar
  und nicht reproduzierbar — I5 wäre nicht durchsetzbar.
- **`additionalProperties: false` überall.** Schema-Drift bei Modellantworten wird sofort
  sichtbar, statt still durchzurutschen.

## Versionierung

`PromptIR` trägt `schemaVersion`. Die beiden anderen Verträge sind über die Ledger-Einträge
versioniert, die sie enthalten (`Decision.schemaVersion`). Migrationen sind vorwärts
gerichtete Funktionen; Ledger-Einträge werden nie umgeschrieben
([04-DATENMODELL.md](../docs/04-DATENMODELL.md) §8).
