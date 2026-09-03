import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const handler = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_leaderboard')

    if (error) {
      const { data: fallback } = await supabase
        .from('battle_games')
        .select('user_id, score, profiles:user_id(username)')
        .order('score', { ascending: false })
        .limit(10)

      if (fallback) {
        const seen = new Set()
        const leaderboard = []
        for (const row of fallback) {
          if (!seen.has(row.user_id)) {
            seen.add(row.user_id)
            leaderboard.push({
              user_id: row.user_id,
              username: row.profiles?.username || 'Unknown',
              best_score: row.score,
            })
          }
        }
        return {
          statusCode: 200,
          body: JSON.stringify(leaderboard),
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data || []),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) }
  }
}
