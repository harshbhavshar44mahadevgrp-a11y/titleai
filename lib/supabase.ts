import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uenkifwpzqqxrcwmbjkr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbmtpZndwenFxeHJjd21iamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDY5NDEsImV4cCI6MjA5OTQ4Mjk0MX0.wJ7pcqmOQO_K8u8pxlf6j3B-XNsJHLB2RMD4U6iUuKE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)