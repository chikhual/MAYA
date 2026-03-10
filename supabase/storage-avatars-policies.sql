-- Políticas de Storage para avatares de perfil (evidencias/avatars/*)
-- Ejecutar en Supabase SQL Editor si la subida de fotos de perfil falla.
--
-- Requisitos: bucket "evidencias" debe existir (Storage > New bucket).
-- En Storage > evidencias > Policies: asegurar que el bucket sea Público para
-- que las URLs de getPublicUrl funcionen.

-- Eliminar políticas previas si existen (para re-ejecutar este script)
DROP POLICY IF EXISTS "Avatar upload autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;

-- Política: usuarios autenticados pueden subir a avatars/
CREATE POLICY "Avatar upload autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Política: permitir actualizar (upsert) archivos propios en avatars/[user_id].*
CREATE POLICY "Avatar update autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] = 'avatars' AND
  split_part(storage.filename(name), '.', 1) = auth.uid()::text
);

-- Política: lectura pública (necesario si el bucket es privado)
CREATE POLICY "Avatar public read"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] = 'avatars'
);
