// Helpers porteret fra FLOW/client/pages/Location.tsx (linje ~64-95)
// Bruges af PublicLocations-siden til adresse-parsing og region-mapping.

export function extractPostcode(text?: string | null): string | null {
  if (!text) return null
  const m = String(text).match(/\b(\d{4})\b/)
  return m ? m[1] : null
}

export function regionFromPostcode(pc?: string | null): string | null {
  if (!pc) return null
  const n = parseInt(pc, 10)
  if (isNaN(n)) return null
  if (n >= 1000 && n <= 3699) return 'Sjælland'
  if (n >= 3700 && n <= 3799) return 'Bornholm'
  if (n >= 3800 && n <= 4999) return 'Sjælland'
  if (n >= 5000 && n <= 5999) return 'Fyn'
  if (n >= 6000 && n <= 9999) return 'Jylland'
  return 'Sjælland'
}

export function parseLatLon(val?: string | null): { lat: number; lon: number } | null {
  if (!val) return null
  const m = val.trim().match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  const lat = parseFloat(m[1])
  const lon = parseFloat(m[2])
  if (isNaN(lat) || isNaN(lon)) return null
  return { lat, lon }
}

// Direct Nominatim er CORS-blokeret fra browser, så vi prøver via /api/geocode
// (Netlify function fra FLOW-mønsteret). Hvis ikke tilgængelig, returnerer null
// så brugeren manuelt kan indtaste lat/lon.
export async function geocodeAddress(
  addr: string,
): Promise<{ lat: number; lon: number; full?: string; postcode?: string | null } | null> {
  try {
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`)
    if (!r.ok) return null
    const data = (await r.json()) as Array<{
      lat: string
      lon: string
      display_name?: string
      address?: { postcode?: string }
    }>
    if (!Array.isArray(data) || data.length === 0) return null
    const top = data[0]
    return {
      lat: parseFloat(top.lat),
      lon: parseFloat(top.lon),
      full: top.display_name,
      postcode: top.address?.postcode || extractPostcode(top.display_name),
    }
  } catch {
    return null
  }
}

// Google MyMap embed-builder — genbruger MID fra FLOW's hoved-locationsmap
// (FLOW/client/pages/Location.tsx:726). Understøtter zoom + center-pan.
const FLOW_MYMAP_MID = '1O6xC9Ib2j2G-jX_YPSlC7Cnyi3grOOhR'
const DEFAULT_CENTER = '55.578639736043904,9.730966349999974' // Danmark center

export function buildMyMapEmbedUrl(opts: {
  center?: { lat: number; lon: number } | null
  zoom?: number
}): string {
  const { center, zoom = 8 } = opts
  const ll = center ? `${center.lat},${center.lon}` : DEFAULT_CENTER
  const base = `https://www.google.com/maps/d/u/0/embed?mid=${FLOW_MYMAP_MID}`
  const params = new URLSearchParams({ ll, z: String(zoom) })
  if (center) params.set('q', ll)
  return `${base}&${params.toString()}`
}

export const MYMAP_EDIT_URL = `https://www.google.com/maps/d/u/0/edit?mid=${FLOW_MYMAP_MID}`

export const PLACE_TYPES = [
  { id: 'park', label: 'Park / grøn plads' },
  { id: 'plads', label: 'Byplads / torv' },
  { id: 'strand', label: 'Strand' },
  { id: 'skov', label: 'Skov' },
  { id: 'plaene', label: 'Græsplæne' },
  { id: 'parkering', label: 'Parkeringsplads' },
  { id: 'sportsplads', label: 'Sportsplads' },
  { id: 'andet', label: 'Andet' },
] as const

export type PlaceType = (typeof PLACE_TYPES)[number]['id']
