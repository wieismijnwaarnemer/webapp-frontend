// Reads huisartsen*.csv files from project root, geocodes each row via PDOK
// Locatieserver (/free), and writes a typed src/data/praktijken.ts.
//
// Run with: node scripts/build-praktijken.mjs

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_FILE = join(ROOT, "src/data/praktijken.ts");

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

function parsePoint(wkt) {
  // "POINT(4.9593 52.5053)" → { lng, lat }
  const m = wkt?.match?.(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

async function geocode(query) {
  const url =
    `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free` +
    `?q=${encodeURIComponent(query)}&rows=1&fl=id,weergavenaam,centroide_ll`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PDOK ${res.status} for "${query}"`);
  const data = await res.json();
  const doc = data?.response?.docs?.[0];
  if (!doc) return null;
  return parsePoint(doc.centroide_ll);
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitAdres(adres) {
  // "Landauerstraat 200, 1445 PX Purmerend" → { straat, postcode, plaats }
  const m = adres.match(/^(.+?),\s*(\d{4}\s?[A-Z]{2})\s+(.+)$/);
  if (!m) return { straat: adres.trim(), postcode: "", plaats: "" };
  return {
    straat: m[1].trim(),
    postcode: m[2].replace(/\s+/g, " ").toUpperCase(),
    plaats: m[3].trim(),
  };
}

async function main() {
  const csvFiles = readdirSync(ROOT).filter((f) =>
    /^huisartsen(_.*)?\.csv$/i.test(f)
  );
  if (csvFiles.length === 0) {
    console.error("No huisartsen*.csv files in project root.");
    process.exit(1);
  }

  const all = [];
  const seenIds = new Set();

  for (const file of csvFiles) {
    console.log(`Reading ${file}…`);
    const text = readFileSync(join(ROOT, file), "utf8");
    const rows = parseCsv(text);
    if (rows.length === 0) continue;
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = {
      stad: header.indexOf("stad"),
      naam: header.indexOf("praktijk naam"),
      adres: header.indexOf("adres"),
      telefoon: header.indexOf("telefoon"),
      email: header.indexOf("email"),
      tijden: header.indexOf("openingstijden"),
      google: header.indexOf("google profiel"),
    };

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[idx.naam]) continue;
      const naam = r[idx.naam].trim();
      const adres = r[idx.adres]?.trim() ?? "";
      const { straat, postcode, plaats } = splitAdres(adres);
      const stad = r[idx.stad]?.trim() || plaats;

      const query = `${straat}, ${postcode} ${plaats || stad}`.trim();
      process.stdout.write(`  geocoding "${naam}"… `);
      let coords = null;
      try {
        coords = await geocode(query);
      } catch (e) {
        console.log(`ERR ${e.message}`);
      }
      if (!coords) {
        console.log("no match");
        continue;
      }
      console.log(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);

      let id = slugify(`${naam}-${stad}`);
      let n = 2;
      while (seenIds.has(id)) id = slugify(`${naam}-${stad}-${n++}`);
      seenIds.add(id);

      const clean = (v) => {
        if (!v) return "";
        const t = v.trim();
        return t === "—" ? "" : t;
      };

      all.push({
        id,
        naam,
        straat,
        postcode,
        plaats: plaats || stad,
        stad,
        telefoon: clean(r[idx.telefoon]),
        email: clean(r[idx.email]),
        openingstijden: clean(r[idx.tijden]),
        google: clean(r[idx.google]),
        lat: coords.lat,
        lng: coords.lng,
      });

      await new Promise((r) => setTimeout(r, 120));
    }
  }

  all.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

  const banner =
    "// AUTO-GENERATED by scripts/build-praktijken.mjs — do not edit by hand.\n" +
    "// Source: huisartsen_*.csv in project root. Re-run the script to refresh.\n\n";

  const typeDef =
    `export type Praktijk = {\n` +
    `  id: string;\n` +
    `  naam: string;\n` +
    `  straat: string;\n` +
    `  postcode: string;\n` +
    `  plaats: string;\n` +
    `  stad: string;\n` +
    `  telefoon: string;\n` +
    `  email: string;\n` +
    `  openingstijden: string;\n` +
    `  google: string;\n` +
    `  lat: number;\n` +
    `  lng: number;\n` +
    `};\n\n`;

  const body =
    `export const praktijken: Praktijk[] = ${JSON.stringify(all, null, 2)};\n`;

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, banner + typeDef + body, "utf8");
  console.log(`\nWrote ${all.length} praktijken → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
