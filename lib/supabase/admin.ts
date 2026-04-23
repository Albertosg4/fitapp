import { createClient } from '@supabase/supabase-js'

// Cliente con service role — SOLO para rutas API server-side
// NUNCA exponer al cliente browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
