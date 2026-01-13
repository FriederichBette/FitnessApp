-- FIX: LÖSCHEN von Logs erlauben
-- Dieses Skript erlaubt dir explizit, deine eigenen Log-Einträge zu löschen.

-- 1. Alte Policy entfernen (falls sie halbgar existiert)
DROP POLICY IF EXISTS "Users delete own logs" ON public.logs;
DROP POLICY IF EXISTS "User deletes own logs" ON public.logs;

-- 2. Neue, korrekte Policy erstellen
CREATE POLICY "Users delete own logs" ON public.logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Sicherheitshalber: Update erlauben (falls mal was korrigiert werden muss)
DROP POLICY IF EXISTS "Users update own logs" ON public.logs;
CREATE POLICY "Users update own logs" ON public.logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
