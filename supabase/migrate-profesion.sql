-- MAYA - Agregar columna 'profesion' a perfiles
-- Ejecutar en SQL Editor de Supabase antes del import

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS profesion TEXT;
