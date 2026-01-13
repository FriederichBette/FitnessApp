-- POLICY FIX: Sichten der Workout-Übungen
-- Problem: Du darfst zwar deine Workouts sehen, aber die RLS hat den Zugriff auf die Übungen "workout_exercises" blockiert,
-- weil die Verknüpfung (JOIN) nicht sauber erlaubt war.

-- 1. Bestehende Policy droppen (falls vorhanden, um Konflikte zu vermeiden)
DROP POLICY IF EXISTS "User manages exercises via workout" ON public.workout_exercises;
DROP POLICY IF EXISTS "Einsicht in Übungen erlaubter Pläne" ON public.workout_exercises;

-- 2. "Einfache" Policy erstellen
-- Erlaubt Zugriff auf alle Übungs-Zeilen, deren Workout-ID zu einem Workout gehört, das DIR gehört oder ein Template ist.
CREATE POLICY "Access own workout exercises" ON public.workout_exercises
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
    AND (w.user_id = auth.uid() OR w.is_template = true)
  )
);
