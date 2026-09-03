-- Run this in Supabase SQL Editor to create the dominion games table

CREATE TABLE IF NOT EXISTS dominion_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  winner_id UUID REFERENCES profiles(id),
  players_count INTEGER NOT NULL DEFAULT 2,
  duration INTEGER,
  players JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE dominion_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dominion_games" ON dominion_games FOR SELECT USING (true);
CREATE POLICY "Auth insert dominion_games" ON dominion_games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update own dominion_games" ON dominion_games FOR UPDATE USING (auth.uid() = winner_id);
