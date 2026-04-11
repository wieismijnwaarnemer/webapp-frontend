// One-shot: merges huisartsen_noord_holland.csv into huisartsen.csv,
// removes duplicates (by normalized praktijknaam + adres), and prints a
// summary (totals, per-city counts, number of duplicates removed).

import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MAIN = join(ROOT, "huisartsen.csv");
const EXTRA = join(ROOT, "huisartsen_noord_holland.csv");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (field.length > 0 || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function encodeField(val) {
  const v = val ?? "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function rowToCsv(row) {
  return row.map(encodeField).join(",");
}

function normalize(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const mainText = readFileSync(MAIN, "utf8");
const extraText = readFileSync(EXTRA, "utf8");

const mainRows = parseCsv(mainText);
const extraRows = parseCsv(extraText);

const header = mainRows[0];
const mainData = mainRows.slice(1).filter((r) => r.length > 1 && r[1]);
const extraData = extraRows.slice(1).filter((r) => r.length > 1 && r[1]);

// Column indexes
const iStad = header.indexOf("Stad");
const iNaam = header.indexOf("Praktijk naam");
const iAdres = header.indexOf("Adres");

const seen = new Set();
const merged = [];
let duplicatesRemoved = 0;

const addRow = (row) => {
  const key = normalize(row[iNaam]) + "|" + normalize(row[iAdres]);
  if (seen.has(key)) {
    duplicatesRemoved += 1;
    return;
  }
  seen.add(key);
  merged.push(row);
};

for (const r of mainData) addRow(r);
for (const r of extraData) addRow(r);

// Per-city counts
const cityCounts = {};
for (const r of merged) {
  const c = r[iStad] || "(Onbekend)";
  cityCounts[c] = (cityCounts[c] ?? 0) + 1;
}

// Write merged CSV
const out = [rowToCsv(header), ...merged.map(rowToCsv)].join("\n") + "\n";
writeFileSync(MAIN, out, "utf8");

// Remove source file
unlinkSync(EXTRA);

// Report
const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
console.log("\n=== MERGE SUMMARY ===");
console.log(`Main file rows (before):  ${mainData.length}`);
console.log(`Extra file rows (before): ${extraData.length}`);
console.log(`Combined raw rows:        ${mainData.length + extraData.length}`);
console.log(`Duplicates removed:       ${duplicatesRemoved}`);
console.log(`Final unique rows:        ${merged.length}`);
console.log(`\nCities:                   ${sortedCities.length}`);
console.log(`\nPer city:`);
for (const [c, n] of sortedCities) {
  console.log(`  ${c.padEnd(30)} ${n}`);
}
console.log(`\nWrote: ${MAIN}`);
console.log(`Deleted: ${EXTRA}\n`);
