import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://ilbjytyukicbssqftmma.supabase.co'
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmp5dHl1a2ljYnNzcWZ0bW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzA0NjEsImV4cCI6MjA3MDQwNjQ2MX0.I_PWByMPcOYhWgeq9MxXgOo-NCZYfEuzYmo35XnBFAY'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
