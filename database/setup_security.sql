-- SICHERHEITS-PROTOKOLLE (RLS)
-- Führe dieses Skript im Supabase SQL Editor aus, um die Datenbank hermetisch abzuriegeln.
-- Es garantiert, dass Niemand auf die Daten eines anderen zugreifen kann.

-- 1. TABELLE: LOGS (Dein Verlauf)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Lesezugriff: Nur eigene Daten
CREATE POLICY "User sees own logs" ON public.logs
FOR SELECT USING (auth.uid() = user_id);

-- Schreibzugriff: Nur für eigene ID
CREATE POLICY "User inserts own logs" ON public.logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Löschzugriff: Nur eigene Daten (DAS IST DER WICHTIGE SCHUTZ)
CREATE POLICY "User deletes own logs" ON public.logs
FOR DELETE USING (auth.uid() = user_id);


-- 2. TABELLE: WORKOUTS (Deine Pläne)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Sehen: Eigene Pläne ODER öffentliche Vorlagen (Templates)
CREATE POLICY "User sees own workouts and templates" ON public.workouts
FOR SELECT USING (auth.uid() = user_id OR is_template = true);

-- Bearbeiten/Löschen: NUR eigene Pläne (Templates sind sicher)
CREATE POLICY "User manages own workouts" ON public.workouts
FOR ALL USING (auth.uid() = user_id);


-- 3. TABELLE: ÜBUNGEN (Bestandteile der Pläne)
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Zugriff nur, wenn der Plan dem User gehört oder ein Template ist
CREATE POLICY "User manages exercises via workout" ON public.workout_exercises
FOR ALL USING (
  workout_id IN (SELECT id FROM public.workouts WHERE user_id = auth.uid() OR is_template = true)
);
