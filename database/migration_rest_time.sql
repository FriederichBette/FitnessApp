-- Spalte für individuelle Pausenzeit hinzufügen, falls noch nicht vorhanden
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS rest_time INTEGER DEFAULT 60;

-- Optional: reps_min entfernen oder in reps_max mergen (wir nutzen jetzt reps_max als Hauptwert)
ALTER TABLE public.workout_exercises RENAME COLUMN reps_max TO reps;
