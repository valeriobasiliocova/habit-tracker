-- Add a unique constraint safely (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'goal_logs_goal_id_date_key'
    ) THEN
        ALTER TABLE public.goal_logs
        ADD CONSTRAINT goal_logs_goal_id_date_key UNIQUE (goal_id, date);
    END IF;
END $$;
