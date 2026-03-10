# Importar socios desde CSV

## 1. Formato del CSV

El archivo debe tener al menos estas columnas (los nombres pueden variar ligeramente):

| Columna CSV             | Campo en MAYA |
|-------------------------|---------------|
| Nombre de confianza     | mote          |
| Nombre                  | nombre        |
| Correo electrónico      | email (auth)  |
| Clasificación           | profesion     |

**Ejemplo** (`datos/socios-ejemplo.csv`):
```csv
Nombre,Nombre de confianza,Correo electrónico,Clasificación
Juan Pérez García,Pancho,juan.perez@ejemplo.com,Ingeniero
María López Sánchez,María,maria.lopez@ejemplo.com,Abogada
```

## 2. Preparar la base de datos

Ejecuta en Supabase SQL Editor:

```sql
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS profesion TEXT;
```

## 3. Configurar .env.local

Añade la **Service Role Key** (Supabase > Settings > API > service_role):

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

⚠️ Nunca expongas la Service Role Key en el frontend.

## 4. Ejecutar la importación

```bash
npm run import-socios datos/tu-nomina.csv
```

- Contraseña temporal por defecto: `Rotary2026!`
- Si el usuario ya existe en Auth, se crea o actualiza solo el perfil.

## 5. Reporte final

El script mostrará:
- Socios cargados con éxito
- Fallidos u omitidos (si hay)
