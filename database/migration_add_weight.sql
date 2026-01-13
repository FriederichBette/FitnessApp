-- Migration to add weight column to workout_exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 0;

-- Refresh schema cache if needed
notify pgrst, 'reload schema';
