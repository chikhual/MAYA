-- Ejecutar en Supabase SQL Editor si ya tienes perfiles y proyectos pero faltan check_semanales y evidencias

-- Check semanales (semáforo)
CREATE TABLE IF NOT EXISTS check_semanales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  completado BOOLEAN NOT NULL,
  fecha_corte DATE NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proyecto_id, fecha_corte)
);

-- Evidencias mensuales (PDF/foto)
CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  fecha_subida DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_semanales_proyecto_fecha ON check_semanales(proyecto_id, fecha_corte);
CREATE INDEX IF NOT EXISTS idx_evidencias_proyecto ON evidencias(proyecto_id);

ALTER TABLE check_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Check semanales visibles para todos" ON check_semanales FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar check" ON check_semanales FOR INSERT WITH CHECK (true);
CREATE POLICY "Evidencias visibles para todos" ON evidencias FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar evidencias" ON evidencias FOR INSERT WITH CHECK (true);
