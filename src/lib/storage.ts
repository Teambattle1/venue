import { supabase } from './supabase'

const BUCKET = 'venue-images'

export async function uploadVenueImage(locationId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${locationId}/${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteVenueImage(imageUrl: string): Promise<boolean> {
  if (!supabase) return false
  const match = imageUrl.match(/venue-images\/(.+)$/)
  if (!match) return false
  const { error } = await supabase.storage.from(BUCKET).remove([match[1]])
  return !error
}
