-- Run this in Supabase SQL Editor to create the goals table

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target INTEGER NOT NULL,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weekly_progress JSONB DEFAULT '[]',
  daily_progress JSONB DEFAULT '[]',
  month_notes JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, good practice)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (for simplicity)
CREATE POLICY "Allow all for anon" ON goals
  FOR ALL
  USING (true)
  WITH CHECK (true);
