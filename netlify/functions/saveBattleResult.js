import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { score, mode } = JSON.parse(event.body)

    if (typeof score !== 'number' || score < 0 || score > 500) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid score' }) }
    }

    const authHeader = event.headers.authorization
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
    }

    const { error: insertError } = await supabase
      .from('battle_games')
      .insert({ user_id: user.id, score, mode: mode || 'rating' })

    if (insertError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save' }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) }
  }
}
