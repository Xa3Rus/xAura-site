CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  anime_name VARCHAR(500),
  anime_image TEXT,
  drawing INTEGER DEFAULT 5 CHECK (drawing >= 1 AND drawing <= 10),
  idea INTEGER DEFAULT 5 CHECK (idea >= 1 AND idea <= 10),
  realization INTEGER DEFAULT 5 CHECK (realization >= 1 AND realization <= 10),
  characters INTEGER DEFAULT 5 CHECK (characters >= 1 AND characters <= 10),
  story INTEGER DEFAULT 5 CHECK (story >= 1 AND story <= 10),
  emotional INTEGER DEFAULT 5 CHECK (emotional >= 1 AND emotional <= 10),
  average_score DECIMAL(4,2) DEFAULT 5.00,
  tier VARCHAR(1) CHECK (tier IN ('S', 'A', 'B', 'C', 'D', 'F')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS tier_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  tiers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tier_templates (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_count INTEGER DEFAULT 0,
  category VARCHAR(100),
  preview TEXT,
  imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_anime_id ON ratings(anime_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tier_lists_user_id ON tier_lists(user_id);
CREATE INDEX idx_tier_templates_slug ON tier_templates(slug);
