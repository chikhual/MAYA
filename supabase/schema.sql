-- MAYA - Esquema Supabase
-- Ejecutar en SQL Editor del proyecto Supabase

-- Perfiles (Directores)
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  club TEXT NOT NULL,
  rol TEXT DEFAULT 'Director',
  foto_url TEXT,
  biografia TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Proyectos
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre_proyecto TEXT NOT NULL,
  descripcion TEXT,
  meta_mensual TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_proyectos_director ON proyectos(director_id);
CREATE INDEX IF NOT EXISTS idx_check_semanales_proyecto_fecha ON check_semanales(proyecto_id, fecha_corte);
CREATE INDEX IF NOT EXISTS idx_evidencias_proyecto ON evidencias(proyecto_id);

-- RLS (ejemplo: permitir lectura pública de perfiles y checks para el dashboard)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura pública para dashboard de semáforos
CREATE POLICY "Perfiles visibles para todos" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Proyectos visibles para todos" ON proyectos FOR SELECT USING (true);
CREATE POLICY "Check semanales visibles para todos" ON check_semanales FOR SELECT USING (true);

-- Inserción/actualización solo autenticados (ajustar según auth)
CREATE POLICY "Usuarios pueden insertar su perfil" ON perfiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios pueden actualizar perfiles" ON perfiles FOR UPDATE USING (true);
CREATE POLICY "Usuarios pueden insertar proyectos" ON proyectos FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios pueden insertar check" ON check_semanales FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios pueden insertar evidencias" ON evidencias FOR INSERT WITH CHECK (true);

-- Storage bucket para evidencias (crear en Dashboard: Storage > New bucket "evidencias", público o con políticas)
-- Política de storage: permitir upload para autenticados, lectura pública o por proyecto
