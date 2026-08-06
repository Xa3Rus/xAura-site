import { supabaseAdmin } from '../monopoly/supabaseAdmin.js'

export async function authenticateSocket(socket, next) {
  const token = socket.handshake?.auth?.token
  if (!token) {
    return next(new Error('Authentication required'))
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      return next(new Error('Invalid token'))
    }
    socket.userId = user.id

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    socket.username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Player'
    next()
  } catch (err) {
    next(new Error('Authentication failed'))
  }
}
