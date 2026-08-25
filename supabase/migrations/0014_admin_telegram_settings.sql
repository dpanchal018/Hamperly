-- 0014_admin_telegram_settings.sql
-- Adds settings for Telegram integration and Super Admin hierarchy

ALTER TABLE public.user_roles 
ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN telegram_chat_id VARCHAR(50),
ADD COLUMN receives_daily_summary BOOLEAN NOT NULL DEFAULT FALSE;

-- Automatically upgrade the first admin in the database to be a Super Admin so you don't get locked out
UPDATE public.user_roles 
SET is_super_admin = TRUE 
WHERE role = 'ADMIN'
AND id = (
    SELECT id FROM public.user_roles 
    WHERE role = 'ADMIN' 
    ORDER BY created_at ASC 
    LIMIT 1
);
