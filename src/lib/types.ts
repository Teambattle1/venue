export interface Contact {
  id: string
  name: string
  title?: string
  mobile?: string
  email?: string
  notes?: string
  linkedin?: string
}

export interface Location {
  id: string
  name: string
  address?: string
  postal_code?: string
  region?: string
  phone?: string
  website?: string
  instagram?: string
  facebook?: string
  contacts: Contact[]
  crm_status: string
  venue_code?: string
  lat?: number | null
  lon?: number | null
  teknisk_service_name?: string | null
  teknisk_service_phone?: string | null
  hidden?: boolean
  venue_type?: 'inde' | 'ude' | 'begge'
}

export interface VenueSpace {
  id: string
  location_id: string
  name: string
  type: 'inde' | 'ude'
  description?: string | null
  image_url?: string | null
  lat?: number | null
  lon?: number | null
  note?: string | null
  adgangsvej?: string | null
  suitable_activities?: string[]
  sort_order: number
  created_at: string
}

export const ACTIVITIES = [
  { id: 'A1', name: 'TeamChallenge', color: '#fdc700' },
  { id: 'A2', name: 'TeamLazer', color: '#2563eb' },
  { id: 'A3', name: 'TeamRobin', color: '#16a34a' },
  { id: 'A4', name: 'TeamBox', color: '#ea580c' },
  { id: 'A5', name: 'TeamConnect', color: '#4e7a27' },
  { id: 'A6', name: 'TeamPlay', color: '#7a219e' },
  { id: 'A7', name: 'TeamTaste', color: '#8B4513' },
  { id: 'A8', name: 'TeamSegway', color: '#dc2626' },
  { id: 'A9', name: 'TeamControl', color: '#000000' },
  { id: 'A10', name: 'TeamConstruct', color: '#f5ec00' },
  { id: 'A11', name: 'TeamAction', color: '#01c7fc' },
  { id: 'A12', name: 'TeamRace', color: '#d357fe' },
  { id: 'A13', name: 'TeamWorld', color: '#ffffff' },
] as const

export const STATUS_COLORS: Record<string, string> = {
  active: '#1a9e75',
  lead: '#d4640a',
  dormant: '#8a8578',
  rejected: '#c03030',
}
