-- Añadir columna biografia a perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS biografia TEXT;
