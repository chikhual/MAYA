-- MAYA - Cron jobs para recordatorio (3 PM) y cierre (4 PM) los viernes
-- Zona horaria: México (UTC-6) → 3 PM = 21:00 UTC, 4 PM = 22:00 UTC
-- Ejecutar en SQL Editor de Supabase (habilitar pg_cron y pg_net en Database > Extensions primero)

-- 1. Crear secretos en Vault (ejecutar UNA vez, reemplaza con tus valores):
-- SELECT vault.create_secret('https://TU-PROJECT-REF.supabase.co', 'maya_project_url');
-- SELECT vault.create_secret('tu-anon-key-aqui', 'maya_anon_key');

-- 2. Programar Recordatorio (viernes 3:00 PM hora México = 21:00 UTC)
SELECT cron.schedule(
  'maya-recordatorio-viernes-3pm',
  '0 21 * * 5',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'maya_project_url') || '/functions/v1/recordatorio-semanal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'maya_anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Programar Cierre (viernes 4:00 PM hora México = 22:00 UTC)
SELECT cron.schedule(
  'maya-cierre-viernes-4pm',
  '0 22 * * 5',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'maya_project_url') || '/functions/v1/cierre-semanal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'maya_anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Para ver jobs: SELECT * FROM cron.job;
-- Para eliminar: SELECT cron.unschedule('maya-recordatorio-viernes-3pm');
