import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://mholxkdpqirkuhtqbhkr.supabase.co'

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_nI1GL7pziQu85QmfjhN0Ig_0i976MwR'

export const supabase = createClient(supabaseUrl, supabaseKey)