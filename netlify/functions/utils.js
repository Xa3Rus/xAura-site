import jwt from 'jsonwebtoken'

export function verifyToken(event) {
  const cookieHeader = event.headers.cookie || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => c.trim().split('=').map((s) => s.trim()))
  )
  const token = cookies.token || event.headers.authorization?.replace('Bearer ', '')

  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...headers,
    },
    body: JSON.stringify(body),
  }
}
