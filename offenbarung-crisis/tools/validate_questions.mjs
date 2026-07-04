#!/usr/bin/env node
/**
 * Smoke-Test der Fragen-Datenbank:
 *   node tools/validate_questions.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "data", "questions.js"), "utf8");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const DB = sandbox.window.QUEST_DB;

let errors = 0;
const fail = (msg) => { console.error("FEHLER:", msg); errors++; };

if (!Array.isArray(DB)) fail("QUEST_DB ist kein Array");
if (DB.length !== 22) fail(`Erwartet 22 Kapitel, gefunden ${DB.length}`);

let total = 0;
DB.forEach((c, i) => {
  if (c.n !== i + 1) fail(`Kapitel an Position ${i} hat n=${c.n}`);
  for (const k of ["title", "emoji", "boss"])
    if (!c[k]) fail(`Kapitel ${c.n}: Feld '${k}' fehlt`);
  if (!Array.isArray(c.key) || !c.key.length) fail(`Kapitel ${c.n}: key-Verse fehlen`);
  if (!Array.isArray(c.q) || c.q.length < 4) fail(`Kapitel ${c.n}: zu wenige Fragen (${c.q?.length})`);
  c.q.forEach((q, j) => {
    total++;
    if (!q.t || !q.e) fail(`Kapitel ${c.n} Frage ${j + 1}: t/e fehlt`);
    if (!Array.isArray(q.o) || q.o.length !== 4) fail(`Kapitel ${c.n} Frage ${j + 1}: braucht genau 4 Optionen`);
    if (!(Number.isInteger(q.a) && q.a >= 0 && q.a < 4)) fail(`Kapitel ${c.n} Frage ${j + 1}: ungueltiger Antwort-Index`);
    if (new Set(q.o.map((s) => s.trim())).size !== 4) fail(`Kapitel ${c.n} Frage ${j + 1}: doppelte Optionen`);
  });
});

if (errors) {
  console.error(`\n${errors} Fehler gefunden.`);
  process.exit(1);
}
console.log(`OK: 22 Kapitel, ${total} Fragen, alle Pruefungen bestanden.`);
