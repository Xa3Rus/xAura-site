-- ============================================
-- xAura Monopoly — Supabase SQL Migration
-- ============================================
-- Выполните этот SQL в Supabase SQL Editor

-- Комнаты
CREATE TABLE IF NOT EXISTS monopoly_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER DEFAULT 4
    CHECK (max_players BETWEEN 2 AND 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Игроки в комнате
CREATE TABLE IF NOT EXISTS monopoly_room_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES monopoly_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  color VARCHAR(20) NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 1500,
  in_jail BOOLEAN DEFAULT FALSE,
  jail_turns INTEGER DEFAULT 0,
  is_bankrupt BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, color)
);

-- Завершённые игры
CREATE TABLE IF NOT EXISTS monopoly_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES monopoly_rooms(id),
  winner_id UUID REFERENCES auth.users(id),
  duration_minutes INTEGER,
  players_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Статистика игроков
CREATE TABLE IF NOT EXISTS monopoly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_money_earned INTEGER DEFAULT 0,
  total_properties_bought INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- История чата
CREATE TABLE IF NOT EXISTS monopoly_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES monopoly_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_name VARCHAR(100),
  receiver_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS политики
ALTER TABLE monopoly_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE monopoly_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE monopoly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monopoly_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут видеть комнаты"
  ON monopoly_rooms FOR SELECT USING (true);

CREATE POLICY "Авторизованные создают комнаты"
  ON monopoly_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Статистика видна всем"
  ON monopoly_stats FOR SELECT USING (true);

CREATE POLICY "Пользователь видит свой чат"
  ON monopoly_chat FOR SELECT
  USING (
    is_private = FALSE OR
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_monopoly_rooms_code ON monopoly_rooms(code);
CREATE INDEX IF NOT EXISTS idx_monopoly_room_players_room ON monopoly_room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_monopoly_chat_room ON monopoly_chat(room_id);
CREATE INDEX IF NOT EXISTS idx_monopoly_games_room ON monopoly_games(room_id);
