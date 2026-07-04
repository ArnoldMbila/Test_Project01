#!/usr/bin/env node
/**
 * Lädt Offenbarung 1–22 (unrevidierte Elberfelder 1905, gemeinfrei)
 * von der getbible-API und bettet den Text fest in die App ein:
 *
 *   node tools/fetch_bibeltext.mjs
 *
 * Erzeugt data/bibeltext.js (window.BIBEL_OFFB = {...}).
 * Danach funktionieren Lese-, Lückentext- und Puzzle-Modus komplett offline.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const URLS = [
  "https://api.getbible.net/v2/elberfelder1905/66.json",
  "https://api.getbible.net/v2/elberfelder/66.json",
];

function normalize(json) {
  const out = {};
  let chapters = json?.chapters;
  if (!chapters) return null;
  if (!Array.isArray(chapters)) chapters = Object.values(chapters);
  for (const ch of chapters) {
    const num = ch.chapter ?? ch.chapter_nr;
    let verses = ch.verses;
    if (!num || !verses) continue;
    if (!Array.isArray(verses)) verses = Object.values(verses);
    out[num] = verses.map((v) => String(v.text ?? v.verse_text ?? "").trim());
  }
  return Object.keys(out).length ? out : null;
}

let data = null, used = null;
for (const url of URLS) {
  try {
    console.log("Lade:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = normalize(await res.json());
    if (data) { used = url; break; }
  } catch (err) {
    console.warn("  fehlgeschlagen:", err.message);
  }
}

if (!data) {
  console.error("Konnte den Bibeltext nicht laden. Bitte Internetverbindung prüfen.");
  process.exit(1);
}

const chapters = Object.keys(data).length;
const verses = Object.values(data).reduce((s, v) => s + v.length, 0);
const banner =
  `/* Offenbarung 1-${chapters}, unrevidierte Elberfelder Uebersetzung (1905, gemeinfrei).\n` +
  `   Automatisch erzeugt von tools/fetch_bibeltext.mjs\n` +
  `   Quelle: ${used} (${verses} Verse) */\n`;

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(
  join(ROOT, "data", "bibeltext.js"),
  banner + "window.BIBEL_OFFB = " + JSON.stringify(data) + ";\n",
  "utf8"
);
console.log(`OK: data/bibeltext.js geschrieben (${chapters} Kapitel, ${verses} Verse).`);
