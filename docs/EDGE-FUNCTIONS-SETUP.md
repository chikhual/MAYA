# Configuración de Edge Functions y Cron Semanal

## 1. Desplegar las Edge Functions

```bash
# Desde la raíz del proyecto
supabase functions deploy recordatorio-semanal
supabase functions deploy cierre-semanal
```

## 2. Secrets en Supabase

En el Dashboard de Supabase: **Project Settings > Edge Functions > Secrets**, añade:

| Secret           | Descripción                              |
|------------------|-------------------------------------------|
| `RESEND_API_KEY` | Tu API key de Resend                      |
| `ADMIN_EMAIL`    | Email del administrador (para el resumen)|
| `RESEND_FROM`    | (Opcional) `MAYA <noreply@tudominio.com>`  |

Para pruebas, Resend permite `onboarding@resend.dev` como remitente.

## 3. Política UPDATE en check_semanales

La función de cierre necesita insertar filas con `completado: false`. Verifica que exista una política de INSERT o UPSERT:

```sql
-- Si usas upsert con service role, no hay problema.
-- Si usas RLS estricto, asegúrate de permitir al service role:
CREATE POLICY "Service role puede upsert check" ON check_semanales
  FOR ALL USING (true) WITH CHECK (true);
-- O mantén la política existente si el service role la bypassea.
```

## 4. Cron con pg_cron (Supabase)

1. **Database > Extensions**: Habilita `pg_cron` y `pg_net`.

2. **SQL Editor**: Crea los secretos en Vault (reemplaza con tus valores):

```sql
SELECT vault.create_secret('https://TU-PROJECT-REF.supabase.co', 'maya_project_url');
SELECT vault.create_secret('TU_ANON_KEY', 'maya_anon_key');
```

3. Ejecuta el contenido de `supabase/cron-semanal.sql`.

## 5. Zona horaria

El cron está ajustado para **México (UTC-6)**:
- 3:00 PM México = 21:00 UTC (recordatorio)
- 4:00 PM México = 22:00 UTC (cierre)

Para otra zona, cambia la hora en el cron (minuto hora * * día).

## 6. .env.local (Next.js)

Añade en tu `.env.local`:

```
RESEND_API_KEY=re_tu_api_key
```

Las Edge Functions usan sus propios secrets en Supabase; esta variable es opcional para la app si no envías correos desde el frontend.
