export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation ikke understøttet'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface NearbyLocation<T> {
  location: T
  distance: number
}

export function filterNearby<T extends { lat?: number | null; lon?: number | null }>(
  locations: T[],
  lat: number,
  lon: number,
  radiusKm: number,
): NearbyLocation<T>[] {
  return locations
    .filter((l) => l.lat != null && l.lon != null)
    .map((l) => ({ location: l, distance: haversineKm(lat, lon, l.lat!, l.lon!) }))
    .filter((l) => l.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}
