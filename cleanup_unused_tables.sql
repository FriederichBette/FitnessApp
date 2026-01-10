-- CLEANUP SCRIPT
-- Löscht alle ungenutzten Tabellen, um die Datenbank sauber zu halten.

DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.routines CASCADE;

-- Info: Übrig bleiben nur die Tabellen, die deine App aktuell wirklich nutzt:
-- 1. logs
-- 2. workouts
-- 3. workout_exercises
