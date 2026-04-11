import {
  allePraktijken,
  type PraktijkDetails,
} from "@/data/praktijk-extras";
import type { Praktijk } from "@/data/praktijken";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Scoort één praktijk voor een (al genormaliseerd) token. 0 = geen match.
// Hogere score = betere match. We wegen naam het zwaarst en belonen matches
// aan het begin van een woord.
function scoreToken(
  p: PraktijkDetails,
  token: string
): number {
  if (!token) return 0;
  const naam = normalize(p.naam);
  const plaats = normalize(p.plaats);
  const stad = normalize(p.stad);
  const straat = normalize(p.straat);
  const postcode = normalize(p.postcode);

  const startsWithWord = (hay: string, t: string) =>
    hay === t ||
    hay.startsWith(t + " ") ||
    hay.includes(" " + t);

  let score = 0;

  // Naam
  if (naam === token) score += 1000;
  else if (naam.startsWith(token)) score += 500;
  else if (startsWithWord(naam, token)) score += 400;
  else if (naam.includes(token)) score += 200;

  // Plaats / stad
  if (plaats === token || stad === token) score += 350;
  else if (plaats.startsWith(token) || stad.startsWith(token)) score += 250;
  else if (plaats.includes(token) || stad.includes(token)) score += 120;

  // Straat
  if (straat.startsWith(token)) score += 120;
  else if (startsWithWord(straat, token)) score += 90;
  else if (straat.includes(token)) score += 50;

  // Postcode (alleen "1016" of "1016dx" soort queries)
  const pcNorm = postcode.replace(/\s+/g, "");
  if (pcNorm.startsWith(token.replace(/\s+/g, ""))) score += 200;

  return score;
}

export function zoekPraktijken(
  query: string,
  limit = 8
): PraktijkDetails[] {
  const q = normalize(query.trim());
  if (q.length < 1) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: Array<{ p: PraktijkDetails; score: number }> = [];
  for (const p of allePraktijken) {
    let total = 0;
    let allMatched = true;
    for (const t of tokens) {
      const s = scoreToken(p, t);
      if (s === 0) {
        allMatched = false;
        break;
      }
      total += s;
    }
    if (allMatched) scored.push({ p, score: total });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.p.naam.localeCompare(b.p.naam, "nl");
  });

  return scored.slice(0, limit).map((x) => x.p);
}

export function getPraktijk(id: string): PraktijkDetails | undefined {
  return allePraktijken.find((p) => p.id === id);
}

export function getPraktijkenByStad(stad: string): PraktijkDetails[] {
  const s = normalize(stad);
  return allePraktijken.filter((p) => normalize(p.stad) === s);
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type PraktijkMetAfstand = PraktijkDetails & { afstandKm: number };

export function getPraktijkenNearby(
  lat: number,
  lng: number,
  maxKm = 4,
  limit = 10
): PraktijkMetAfstand[] {
  return allePraktijken
    .map((p) => ({
      ...p,
      afstandKm: haversineKm({ lat, lng }, { lat: p.lat, lng: p.lng }),
    }))
    .filter((p) => p.afstandKm <= maxKm)
    .sort((a, b) => a.afstandKm - b.afstandKm)
    .slice(0, limit);
}

export function getNearestPraktijken(
  praktijkId: string,
  count = 4
): PraktijkDetails[] {
  const self = getPraktijk(praktijkId);
  if (!self) return [];
  return allePraktijken
    .filter((p) => p.id !== praktijkId)
    .map((p) => ({ p, d: haversineKm(self, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.p);
}

export type { Praktijk, PraktijkDetails };
