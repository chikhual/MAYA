-- MAYA - Agregar columna 'mote' (apodo) a perfiles
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mote TEXT;
