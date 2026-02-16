-- Migration: Fundamental Session Upgrade
-- Introduces a dedicated 'sessions' table to track workout instances more robustly.

-- 1. Create SESSIONS table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'aborted')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    workout_name TEXT,
    routine_name TEXT,
    config JSONB NOT NULL, -- Snapshot of exercise structure at start
    current_draft JSONB, -- Live progress (sets, renames)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add session_id to LOGS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'logs' AND column_name = 'session_id') THEN
        ALTER TABLE public.logs ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.sessions;
CREATE POLICY "Users can manage their own sessions"
    ON public.sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_logs_session_id ON public.logs(session_id);
