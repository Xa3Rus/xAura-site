import jwt from 'jsonwebtoken'
import pool from './db.js'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

function getUserId(event) {
  const cookieHeader = event.headers.cookie || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').filter(c => c.includes('=')).map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const token = cookies.token || event.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET).userId
  } catch {
    return null
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const userId = getUserId(event)
  if (!userId) {
    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Не авторизован' }) }
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await pool.query(
        'SELECT * FROM ratings WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      return { statusCode: 200, headers, body: JSON.stringify({ ratings: result.rows }) }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body)

      if (body.anime_id !== undefined && body.tier !== undefined) {
        const existing = await pool.query(
          'SELECT id FROM ratings WHERE user_id = $1 AND anime_id = $2',
          [userId, body.anime_id]
        )
        if (existing.rows.length > 0) {
          await pool.query(
            'UPDATE ratings SET tier = $1 WHERE user_id = $2 AND anime_id = $3',
            [body.tier, userId, body.anime_id]
          )
          return { statusCode: 200, headers, body: JSON.stringify({ message: 'Тир обновлён' }) }
        }
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Оценка не найдена' }) }
      }

      const { anime_id, anime_name, anime_image, drawing, idea, realization, characters, story, emotional, average_score } = body

      const existing = await pool.query(
        'SELECT id FROM ratings WHERE user_id = $1 AND anime_id = $2',
        [userId, anime_id]
      )
      if (existing.rows.length > 0) {
        return { statusCode: 409, headers, body: JSON.stringify({ message: 'Вы уже оценили это аниме' }) }
      }

      const result = await pool.query(
        `INSERT INTO ratings (user_id, anime_id, anime_name, anime_image, drawing, idea, realization, characters, story, emotional, average_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [userId, anime_id, anime_name, anime_image, drawing, idea, realization, characters, story, emotional, average_score]
      )

      return { statusCode: 201, headers, body: JSON.stringify({ rating: result.rows[0] }) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed' }) }
  } catch (err) {
    console.error('Ratings error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Ошибка сервера' }) }
  }
}
