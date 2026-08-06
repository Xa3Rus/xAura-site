import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwwddmnvoagdyriskval.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3d2RkbW52b2FnZHlyaXNrdmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjAxMjQsImV4cCI6MjEwMDMzNjEyNH0.Q5_1eS094AbQB77PGhc6E2wWtxv8mnvX1QLJMMBIUKo'

export const supabase = createClient(supabaseUrl, supabaseKey)
