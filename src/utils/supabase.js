import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwwddmnvoagdyriskval.supabase.co'
const supabaseKey = 'sb_publishable_5501pjVTxbyhIA76n2SRZw_yOdW4sTr'

export const supabase = createClient(supabaseUrl, supabaseKey)
