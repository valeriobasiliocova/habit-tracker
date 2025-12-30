-- 1. Add 'quarterly' to the enum
-- Note: Postgres doesn't support IF NOT EXISTS for enum values in a simple one-liner easily without a block, 
-- but normally ALTER TYPE ... ADD VALUE is safe to run if it doesn't exist. 
-- However, Supabase/Postgres might error if it already exists. 
-- A safer block for enum:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'long_term_goal_type' AND e.enumlabel = 'quarterly') THEN
        ALTER TYPE public.long_term_goal_type ADD VALUE 'quarterly';
    END IF;
END$$;

-- 2. Add quarter column
ALTER TABLE public.long_term_goals ADD COLUMN IF NOT EXISTS quarter integer;

-- 3. Add constraint
ALTER TABLE public.long_term_goals DROP CONSTRAINT IF EXISTS long_term_goals_quarter_check;
ALTER TABLE public.long_term_goals ADD CONSTRAINT long_term_goals_quarter_check CHECK (quarter >= 1 AND quarter <= 4);
