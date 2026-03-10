-- MAYA - Tabla de Logros Mensuales (Agenda de Logros)
-- Ejecutar en SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS logros_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  mes SMALLINT NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio SMALLINT NOT NULL,
  nombre_logro TEXT NOT NULL,
  descripcion TEXT,
  file_url TEXT NOT NULL,
  filename TEXT,
  es_imagen BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_logros_user_mes_anio ON logros_mensuales(user_id, anio, mes);

ALTER TABLE logros_mensuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logros visibles para todos" ON logros_mensuales FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar su logro" ON logros_mensuales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar su logro" ON logros_mensuales FOR UPDATE USING (auth.uid() = user_id);
