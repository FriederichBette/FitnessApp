-- LÜCKE SCHLIESSEN: DELETE für LOGS
-- Aktuell darfst du Logs nur sehen (SELECT) und erstellen (INSERT).
-- Das Löschen ist durch RLS blockiert. Führe das hier aus:

CREATE POLICY "Users delete own logs" ON public.logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Falls du Einträge auch korrigieren willst (Update)
CREATE POLICY "Users update own logs" ON public.logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
