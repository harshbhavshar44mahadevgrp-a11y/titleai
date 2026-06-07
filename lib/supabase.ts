import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phtgfpdnirreomaeunfk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBodGdmcGRuaXJyZW9tYWV1bmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMDA5ODMsImV4cCI6MjA5NDU3Njk4M30.sU38swcz68otjanP4zJ_C1i4pN92gD2saJw-lPlHX0c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)