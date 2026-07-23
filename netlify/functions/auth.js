import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const path = event.path.split('/').pop()

  try {
    if (path === 'register' && event.httpMethod === 'POST') {
      const { username, email, password } = JSON.parse(event.body)

      if (!username || !email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Все поля обязательны' }) }
      }
      if (password.length < 6) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Пароль должен содержать минимум 6 символов' }) }
      }

      const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username])
      if (existing.rows.length > 0) {
        return { statusCode: 409, headers, body: JSON.stringify({ message: 'Пользователь уже существует' }) }
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, passwordHash]
      )

      const user = result.rows[0]
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

      return {
        statusCode: 201,
        headers: { ...headers, 'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        body: JSON.stringify({ token, user: { id: user.id, username: user.username, email: user.email } }),
      }
    }

    if (path === 'login' && event.httpMethod === 'POST') {
      const { email, password } = JSON.parse(event.body)

      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email и пароль обязательны' }) }
      }

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      if (result.rows.length === 0) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Неверный email или пароль' }) }
      }

      const user = result.rows[0]
      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Неверный email или пароль' }) }
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

      return {
        statusCode: 200,
        headers: { ...headers, 'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        body: JSON.stringify({ token, user: { id: user.id, username: user.username, email: user.email } }),
      }
    }

    if (path === 'me' && event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization
      const cookieHeader = event.headers.cookie || ''
      const cookies = Object.fromEntries(
        cookieHeader.split(';').filter(c => c.includes('=')).map((c) => {
          const [k, ...v] = c.trim().split('=')
          return [k, v.join('=')]
        })
      )
      const token = cookies.token || authHeader?.replace('Bearer ', '')

      if (!token) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Не авторизован' }) }
      }

      let decoded
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
      } catch {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Неверный токен' }) }
      }

      const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.userId])
      if (result.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Пользователь не найден' }) }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: result.rows[0] }),
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) }
  } catch (err) {
    console.error('Auth error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Ошибка сервера' }) }
  }
}
