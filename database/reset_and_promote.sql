-- 1. CLEANUP: Lösche alle Nutzerdaten, BEHALTE System-Templates
-- ACHTUNG: Das löscht ALLES außer den offiziellen Plänen!

-- Lösche Logs
DELETE FROM logs;

-- Lösche Übungen von privaten Plänen
DELETE FROM workout_exercises 
WHERE workout_id IN (SELECT id FROM workouts WHERE is_template = false);

-- Lösche private Pläne
DELETE FROM workouts WHERE is_template = false;

-- OPTIONAL: Setze ID-Zähler zurück (falls gewünscht)
-- ALTER SEQUENCE workouts_id_seq RESTART WITH 1;


-- ---------------------------------------------------------
-- ---------------- ADMIN CHEAT SHEET ----------------------
-- ---------------------------------------------------------

-- FRAGE: Wie erstelle ich neue System-Vorlagen?
-- ANTWORT:
-- 1. Erstelle den Plan ganz normal in der App (als User).
-- 2. Merk dir den genauen Namen (z.B. "Push Day Pro").
-- 3. Führe folgenden Befehl hier im SQL Editor aus:

-- UPDATE workouts 
-- SET is_template = true, user_id = NULL 
-- WHERE name = 'Push Day Pro';

-- Damit wird dein privater Plan zur System-Vorlage für ALLE!
