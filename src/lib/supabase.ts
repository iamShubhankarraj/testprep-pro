// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: As per your request, the URL and Key are directly embedded here.
// Please be aware that in a production environment, it is HIGHLY RECOMMENDED
// to use environment variables (e.g., process.env.NEXT_PUBLIC_SUPABASE_URL)
// to keep your keys secure and out of your public codebase.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
