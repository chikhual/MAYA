-- MAYA - Agregar columna 'mote' (apodo) a perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mote TEXT;
