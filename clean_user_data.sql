-- Clean up ALL user data but PRESERVE system templates

-- 1. Delete all history logs (Training Data)
DELETE FROM logs;

-- 2. Delete exercises linked to User Workouts (Non-Templates)
DELETE FROM workout_exercises
WHERE workout_id IN (SELECT id FROM workouts WHERE is_template = false);

-- 3. Delete User Workouts
DELETE FROM workouts
WHERE is_template = false;

-- Confirmation
SELECT 'Database cleaned: User data removed, Templates preserved.' as status;
