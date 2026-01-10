-- TEMPLATE IMPORT SCRIPT
-- Importiert die "Full Body" Routine als System-Templates
-- Führe dieses Skript im Supabase SQL Editor aus.

DO $$
DECLARE
    v_user_id UUID;
    v_w1_id UUID;
    v_w2_id UUID;
    v_w3_id UUID;
BEGIN
    -- 1. Wir brauchen einen "Besitzer" für die Templates.
    -- Wir nehmen einfach den ersten User, den wir in der Datenbank finden (das bist wahrscheinlich du).
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Fehler: Es existiert noch kein User in der auth.users Tabelle. Bitte registriere dich einmal in der App!';
    END IF;

    -- Optional: Vorherige Versionen dieser Templates löschen, um Duplikate zu vermeiden
    DELETE FROM public.workouts WHERE routine_name = 'FULL_BODY_SYSTEM' AND is_template = true;


    -- =============================================
    -- WORKOUT 1: FULL BODY 1
    -- =============================================
    INSERT INTO public.workouts (name, user_id, is_template, routine_name)
    VALUES ('FULL BODY 1', v_user_id, true, 'FULL_BODY_SYSTEM')
    RETURNING id INTO v_w1_id;

    INSERT INTO public.workout_exercises (workout_id, exercise, sets, reps, rest_time) VALUES
    (v_w1_id, 'Deadlift', 4, 12, 90),
    (v_w1_id, 'Bench Press', 4, 12, 90),
    (v_w1_id, 'Barbell Row', 4, 10, 60),
    (v_w1_id, 'Overhead Press', 4, 12, 60),
    (v_w1_id, 'Sumo Deadlift', 4, 12, 90),
    (v_w1_id, 'Diamond Push-Up', 4, 12, 60),
    (v_w1_id, 'Dumbbell Curl', 4, 15, 60),
    (v_w1_id, 'Lateral Raise', 4, 12, 60);


    -- =============================================
    -- WORKOUT 2: FULL BODY 2
    -- =============================================
    INSERT INTO public.workouts (name, user_id, is_template, routine_name)
    VALUES ('FULL BODY 2', v_user_id, true, 'FULL_BODY_SYSTEM')
    RETURNING id INTO v_w2_id;

    INSERT INTO public.workout_exercises (workout_id, exercise, sets, reps, rest_time) VALUES
    (v_w2_id, 'Pull-Up', 4, 12, 90),
    (v_w2_id, 'Incline Bench Press', 4, 12, 90),
    (v_w2_id, 'Sumo Deadlift', 3, 12, 90),
    (v_w2_id, 'Arnold Press (DB)', 4, 12, 60),
    (v_w2_id, 'Diamond Push-Up', 4, 12, 60),
    (v_w2_id, 'Dumbbell Curl', 4, 15, 60);


    -- =============================================
    -- WORKOUT 3: FULL BODY 3
    -- =============================================
    INSERT INTO public.workouts (name, user_id, is_template, routine_name)
    VALUES ('FULL BODY 3', v_user_id, true, 'FULL_BODY_SYSTEM')
    RETURNING id INTO v_w3_id;

    INSERT INTO public.workout_exercises (workout_id, exercise, sets, reps, rest_time) VALUES
    (v_w3_id, 'Bench Press', 4, 15, 90),
    (v_w3_id, 'DB Bent Over Row', 4, 10, 60),
    (v_w3_id, 'Close-Grip Bench Press', 4, 12, 60),
    (v_w3_id, 'Lateral Raise', 4, 20, 45),
    (v_w3_id, 'Standing Calf Raise', 4, 30, 45),
    (v_w3_id, 'Dumbbell Curl', 4, 15, 60);

END $$;
