// Наполняет тестовый аккаунт designpreview данными для оценки дизайна профиля.
// Запуск: node scripts/seed-preview-user.mjs
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwwddmnvoagdyriskval.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3d2RkbW52b2FnZHlyaXNrdmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjAxMjQsImV4cCI6MjEwMDMzNjEyNH0.Q5_1eS094AbQB77PGhc6E2wWtxv8mnvX1QLJMMBIUKo'

const EMAIL = 'designpreview_test@xaura.dev'
const PASSWORD = 'TestPass123!'

const supabase = createClient(supabaseUrl, supabaseKey)
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (authErr) { console.error('login failed:', authErr.message); process.exit(1) }
const uid = auth.user.id
console.log('uid:', uid)

// очистка старых данных этого юзера
await supabase.from('ratings').delete().eq('user_id', uid)
await supabase.from('tier_lists').delete().eq('user_id', uid)
await supabase.from('battle_games').delete().eq('user_id', uid)

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

// (id, name, image, [drawing, idea, realization, characters, story, emotional], days ago)
const R = [
  [5114, 'Клинок, рассекающий демонов', 'https://shikimori.one/system/animes/original/5114.webp', [9, 8, 9, 9, 8, 9], 2],
  [16498, 'В.attack on titan', 'https://shikimori.one/system/animes/original/16498.webp', [8, 10, 9, 9, 10, 9], 5],
  [11061, 'Хантер х Хантер', 'https://shikimori.one/system/animes/original/11061.webp', [9, 9, 9, 10, 9, 9], 9],
  [20, 'Наруто', 'https://shikimori.one/system/animes/original/20.webp', [6, 7, 6, 7, 6, 8], 14],
  [21, 'One Piece', 'https://shikimori.one/system/animes/original/21.webp', [7, 9, 7, 9, 8, 8], 18],
  [1535, 'Тетрадь смерти', 'https://shikimori.one/system/animes/original/1535.webp', [8, 9, 8, 9, 8, 8], 23],
  [30276, 'One Punch Man', 'https://shikimori.one/system/animes/original/30276.webp', [9, 8, 9, 8, 7, 9], 27],
  [28851, 'Ван Пис: Золото', 'https://shikimori.one/system/animes/original/28851.webp', [7, 6, 7, 7, 6, 7], 33],
  [19815, 'Нет игры — нет жизни', 'https://shikimori.one/system/animes/original/19815.webp', [9, 8, 8, 8, 7, 8], 41],
  [31964, 'Мастера меча онлайн', 'https://shikimori.one/system/animes/original/31964.webp', [7, 7, 7, 6, 6, 7], 47],
  [9253, 'Стальной алхимик', 'https://shikimori.one/system/animes/original/9253.webp', [8, 9, 9, 9, 9, 9], 55],
  [9989, "Психопаспорт", 'https://shikimori.one/system/animes/original/9989.webp', [8, 9, 8, 8, 9, 8], 62],
  [11757, 'Мастера меча онлайн (TV)', 'https://shikimori.one/system/animes/original/11757.webp', [6, 7, 7, 7, 6, 6], 70],
  [22319, 'Токийский гуль', 'https://shikimori.one/system/animes/original/22319.webp', [7, 7, 7, 7, 6, 7], 84],
  [20958, 'Червь парализатора', 'https://shikimori.one/system/animes/original/20958.webp', [5, 6, 5, 5, 5, 6], 95],
  [33352, 'Вайолет Эвергарден', 'https://shikimori.one/system/animes/original/33352.webp', [10, 8, 10, 8, 8, 10], 103],
  [39587, 'Реинкарнация безработного', 'https://shikimori.one/system/animes/original/39587.webp', [8, 8, 9, 9, 8, 8], 118],
  [41467, 'Блич: Тысячелетняя кровавая война', 'https://shikimori.one/system/animes/original/41467.webp', [9, 7, 9, 8, 7, 9], 130],
  [38000, 'Кагуя-сама: в любви как на войне', 'https://shikimori.one/system/animes/original/38000.webp', [8, 8, 8, 9, 8, 9], 145],
  [48583, 'Токийские мстители', 'https://shikimori.one/system/animes/original/48583.webp', [7, 7, 8, 8, 7, 9], 160],
  [40748, 'Жужжащие насекомые', 'https://shikimori.one/system/animes/original/40748.webp', [4, 5, 4, 4, 4, 5], 175],
  [21, 'Берсерк', 'https://shikimori.one/system/animes/original/21.webp', [7, 9, 6, 8, 8, 7], 190],
  [7088, "Мастера дуг", 'https://shikimori.one/system/animes/original/7088.webp', [6, 6, 6, 6, 6, 6], 210],
  [5784, 'Гинтама', 'https://shikimori.one/system/animes/original/5784.webp', [8, 9, 8, 10, 8, 10], 230],
  [4224, 'Торадора', 'https://shikimori.one/system/animes/original/4224.webp', [7, 7, 8, 8, 7, 9], 250],
  [9969, 'Гандам 00', 'https://shikimori.one/system/animes/original/9969.webp', [6, 7, 6, 6, 7, 6], 270],
]

const ratings = R.map(([id, name, image, s, d]) => ({
  user_id: uid,
  anime_id: id,
  anime_name: name,
  anime_image: image,
  drawing: s[0], idea: s[1], realization: s[2], characters: s[3], story: s[4], emotional: s[5],
  average_score: Number((s.reduce((a, b) => a + b, 0) / 6).toFixed(2)),
  created_at: daysAgo(d),
}))

const { error: rErr } = await supabase.from('ratings').insert(ratings)
if (rErr) console.error('ratings:', rErr.message)
else console.log('ratings inserted:', ratings.length)

const tiers = [
  { id: 's', name: 'S', color: '#FF7A7A', items: [{ id: 1, name: 'Хантер х Хантер', image: 'https://shikimori.one/system/animes/original/11061.webp' }, { id: 2, name: 'Стальной алхимик', image: 'https://shikimori.one/system/animes/original/9253.webp' }] },
  { id: 'a', name: 'A', color: '#FFC266', items: [{ id: 3, name: 'Клинок, рассекающий демонов', image: 'https://shikimori.one/system/animes/original/5114.webp' }] },
  { id: 'b', name: 'B', color: '#FFE066', items: [{ id: 4, name: 'Наруто', image: 'https://shikimori.one/system/animes/original/20.webp' }, { id: 5, name: 'Ван Пис', image: 'https://shikimori.one/system/animes/original/21.webp' }] },
  { id: 'c', name: 'C', color: '#88D9A0', items: [] },
  { id: 'd', name: 'D', color: '#7AB8FF', items: [{ id: 6, name: 'Токийский гуль', image: 'https://shikimori.one/system/animes/original/22319.webp' }] },
]

const { error: tErr } = await supabase.from('tier_lists').insert([
  { user_id: uid, name: 'Сёнэн-классика', tiers: JSON.stringify({ tiers, pool: [] }), created_at: daysAgo(30) },
  { user_id: uid, name: 'Аниме 2024', tiers: JSON.stringify({ tiers, pool: [] }), created_at: daysAgo(75) },
  { user_id: uid, name: 'Ромком-баттл', tiers: JSON.stringify({ tiers, pool: [] }), created_at: daysAgo(120) },
])
if (tErr) console.error('tier_lists:', tErr.message)
else console.log('tier_lists inserted: 3')

const battles = [18, 22, 25, 21, 30, 17, 26, 24, 31, 19, 28, 23, 20, 16].map((score, i) => ({
  user_id: uid, score, mode: 'rating', created_at: daysAgo(i * 6 + 3),
}))
const { error: bErr } = await supabase.from('battle_games').insert(battles)
if (bErr) console.error('battle_games:', bErr.message)
else console.log('battle_games inserted:', battles.length)
console.log('done')
