import { createClient } from '@supabase/supabase-js'

// Hardcoded to the LIVE project on purpose. A stale NEXT_PUBLIC_SUPABASE_URL env var on Vercel
// (pointing at a now-deleted project) was overriding the env-first fallback and breaking auth
// with "Failed to fetch". Reading the env var directly here would let that dead value win again,
// so we pin the correct project in code. The anon key is a PUBLIC client key (safe to ship;
// data is protected by Row Level Security). To migrate projects later, change these two lines.
const supabaseUrl = 'https://uenkifwpzqqxrcwmbjkr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbmtpZndwenFxeHJjd21iamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDY5NDEsImV4cCI6MjA5OTQ4Mjk0MX0.wJ7pcqmOQO_K8u8pxlf6j3B-XNsJHLB2RMD4U6iUuKE'

// Session sessionStorage mein rehta hai — tab/browser band karte hi logout,
// wapas aane par dobara login karna padta hai (business requirement).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: typeof window !== 'undefined'
        ? { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true }
        : { persistSession: false },
})