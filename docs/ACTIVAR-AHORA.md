# Activar automatización semanal – MAYA

## Paso 1: Iniciar sesión en Supabase (una sola vez)

En la terminal:

```bash
npx supabase login
```

Se abrirá el navegador para autenticarte.

---

## Paso 2: Desplegar Edge Functions

```bash
npx supabase functions deploy recordatorio-semanal --project-ref mqwcrmajddyyydaytqwi
npx supabase functions deploy cierre-semanal --project-ref mqwcrmajddyyydaytqwi
```

---

## Paso 3: Secrets en Supabase Dashboard

1. Entra a [Supabase Dashboard](https://supabase.com/dashboard/project/mqwcrmajddyyydaytqwi)
2. **Project Settings** (icono engranaje) → **Edge Functions** → **Secrets**
3. Añade:

| Nombre         | Valor                    |
|----------------|--------------------------|
| `RESEND_API_KEY` | Tu API key de Resend     |
| `ADMIN_EMAIL`    | Email del administrador  |
| `RESEND_FROM`    | `MAYA <onboarding@resend.dev>` (pruebas) |

---

## Paso 4: Extensiones y cron en la base de datos

1. **Database** → **Extensions** → Activa `pg_cron` y `pg_net`

2. **SQL Editor** → Abre y ejecuta `supabase/cron-semanal-activar.sql`

   (Si los secretos de Vault ya existen, omite las dos primeras líneas `vault.create_secret` o ajusta el SQL.)

---

## Verificar

- **Edge Functions**: En **Edge Functions** del Dashboard deberías ver `recordatorio-semanal` y `cierre-semanal`
- **Cron**: En SQL: `SELECT * FROM cron.job;` debe mostrar los dos jobs
- **Prueba manual**: Invoca la función desde el Dashboard (Run) o con curl para comprobar que responde
