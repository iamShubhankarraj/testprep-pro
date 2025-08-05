// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

// Get the environment variables from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// The '!' at the end is a non-null assertion operator. It tells TypeScript
// that you are certain these variables will exist when the code runs.
// If they are missing, it's better for the app to fail immediately on startup
// than to have unexpected errors during user sessions.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)