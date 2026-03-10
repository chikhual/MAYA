# MONITOREO – Tracking de Proyectos · Club Rotario

Aplicación de seguimiento semanal por semáforos para directores de proyecto de un Club Rotario. Construida con **Next.js**, **Tailwind CSS** y **Supabase**.

## Regla de oro UI

- Usuarios con edad promedio ~75 años.
- Botones muy grandes, tipografía mínima 18px, alto contraste, navegación lineal.
- Sin pop-ups complejos ni menús anidados.

## Funcionalidad principal

1. **Semáforo semanal**: check “Trabajé / No trabajé” por semana.
2. **Cierre semanal**: Viernes 4:00 PM. Sin check → semáforo en rojo.
3. **Dashboard público**: Lista de directores con estado Verde (cumplió) / Rojo (pendiente).
4. **Evidencias mensuales**: Subida de PDF o foto como evidencia de logros.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## Instalación

```bash
npm install
```

## Configuración Supabase

1. Crea un proyecto en [Supabase](https://app.supabase.com).
2. En **SQL Editor**, ejecuta el contenido de `supabase/schema.sql` para crear tablas y RLS.
3. En **Storage**, crea un bucket llamado `evidencias` (público o con políticas que permitan lectura/escritura según tu auth).
4. Copia `.env.local.example` a `.env.local` y rellena (sin esto la app arranca pero check-in, dashboard y evidencias fallarán en tiempo de ejecución):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura de datos (resumen)

- **perfiles**: Directores (nombre, club, rol, foto_url).
- **proyectos**: Proyecto por director (nombre, descripción, meta_mensual).
- **check_semanales**: Un registro por proyecto y semana (completado, fecha_corte viernes).
- **evidencias**: Archivos (file_url) por proyecto y fecha.

## Rutas

- `/` – Inicio con enlaces a Check-in y Semáforos.
- `/checkin` – Check-in rápido (Sí trabajé / No trabajé).
- `/dashboard` – Semáforos del club (lista de directores Verde/Rojo).
- `/evidencias` – Subida de evidencias (PDF/JPG).

## Autenticación

MAYA usa Supabase Auth con sesiones persistentes en cookies (30 días).

1. En Supabase Dashboard → **Authentication** → **Providers**, activa **Email**.
2. Crea usuarios en **Authentication** → **Users** → **Add user**.
3. Las sesiones se mantienen al cerrar el navegador gracias a las cookies configuradas con `persistSession: true`.

## Seguridad (RLS)

Por defecto, las políticas de RLS son permisivas para desarrollo. Para producción, ejecuta `supabase/rls-seguro.sql` después de configurar Supabase Auth y vincular `perfiles.user_id` con `auth.users(id)`. Así solo se permitirá insertar checks en proyectos propios.

## Colores

- Rotary Blue: `#17458f`
- Rotary Gold: `#f7a81b`
- Semáforo Verde: `#22c55e`
- Semáforo Rojo: `#dc2626`
