-- MAYA - Activar Cron (ejecutar en SQL Editor de Supabase)
-- Requisito: Database > Extensions > Habilitar pg_cron y pg_net
-- Proyecto: mqwcrmajddyyydaytqwi

-- 1. Crear secretos en Vault (ejecutar PRIMERO, una sola vez)
-- Si ya existen, comenta estas líneas o verás error "duplicate key"
SELECT vault.create_secret('https://mqwcrmajddyyydaytqwi.supabase.co', 'maya_project_url');
SELECT vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xd2NybWFqZGR5eXlkYXl0cXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTEyNDMsImV4cCI6MjA4ODY2NzI0M30.t3Co0yHU38XYN4jILP2VS45-ks1MbM9mqZJ4jwbsA6w', 'maya_anon_key');

-- 2. Programar Recordatorio (viernes 3 PM México = 21:00 UTC)
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

-- 3. Programar Cierre (viernes 4 PM México = 22:00 UTC)
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
