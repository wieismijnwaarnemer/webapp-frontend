import { praktijken, type Praktijk } from "@/data/praktijken";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function zoekPraktijken(query: string, limit = 8): Praktijk[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return praktijken
    .filter((p) => {
      const hay = normalize(
        `${p.naam} ${p.straat} ${p.postcode} ${p.plaats} ${p.stad}`
      );
      return hay.includes(q);
    })
    .slice(0, limit);
}

export function getPraktijk(id: string): Praktijk | undefined {
  return praktijken.find((p) => p.id === id);
}

export function getPraktijkenByStad(stad: string): Praktijk[] {
  const s = normalize(stad);
  return praktijken.filter((p) => normalize(p.stad) === s);
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

export function getNearestPraktijken(
  praktijkId: string,
  count = 4
): Praktijk[] {
  const self = getPraktijk(praktijkId);
  if (!self) return [];
  return praktijken
    .filter((p) => p.id !== praktijkId)
    .map((p) => ({ p, d: haversineKm(self, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.p);
}

export type { Praktijk };
