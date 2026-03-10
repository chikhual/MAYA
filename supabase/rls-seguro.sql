-- RLS SEGURO: Evitar que un Director marque el check-in de otro
-- IMPORTANTE: Requiere Supabase Auth habilitado. Vincular perfiles.user_id a auth.users(id).
-- Ejecutar DESPUÉS de haber configurado auth y tras poblar perfiles.user_id.

-- Eliminar políticas permisivas actuales
DROP POLICY IF EXISTS "Usuarios pueden insertar check" ON check_semanales;

-- Solo permitir INSERT en check_semanales para proyectos cuyo director tiene user_id = auth.uid()
CREATE POLICY "Solo check en proyectos propios"
ON check_semanales FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM proyectos p
    JOIN perfiles pf ON p.director_id = pf.id
    WHERE p.id = proyecto_id AND pf.user_id = auth.uid()
  )
);

-- Solo permitir UPDATE en check_semanales para proyectos propios
CREATE POLICY "Solo actualizar check en proyectos propios"
ON check_semanales FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM proyectos p
    JOIN perfiles pf ON p.director_id = pf.id
    WHERE p.id = proyecto_id AND pf.user_id = auth.uid()
  )
);

-- Opcional: Filtrar proyectos por usuario (para que .select() devuelva solo los del usuario)
DROP POLICY IF EXISTS "Proyectos visibles para todos" ON proyectos;
CREATE POLICY "Proyectos visibles para todos" ON proyectos FOR SELECT USING (true);
-- Con auth, alternativa restrictiva:
-- CREATE POLICY "Proyectos solo del usuario" ON proyectos FOR SELECT
-- USING (director_id IN (SELECT id FROM perfiles WHERE user_id = auth.uid()));
