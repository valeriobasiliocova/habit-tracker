
-- Add color column to long_term_goals
ALTER TABLE public.long_term_goals ADD COLUMN IF NOT EXISTS color text DEFAULT null;
