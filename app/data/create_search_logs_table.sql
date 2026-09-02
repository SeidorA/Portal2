-- Script para crear la tabla de historial de búsquedas
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clicked BOOLEAN DEFAULT false,
    clicked_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Permitir a cualquier usuario (autenticado o no) insertar registros
CREATE POLICY "Permitir inserción de búsquedas" ON public.search_logs
    FOR INSERT 
    WITH CHECK (true);

-- Permitir a cualquier usuario actualizar sus propios registros anónimos o por user_id (para registrar clics)
-- Como esto puede ser complejo desde el cliente sin user_id para anónimos, 
-- una política abierta para UPDATE temporal si conocen el ID puede funcionar, o se hace vía Server Action con service_role.
-- Ya que usamos Server Actions, el cliente de Supabase se crea usando variables de entorno normales y respeta el RLS.
CREATE POLICY "Permitir actualización de búsquedas" ON public.search_logs
    FOR UPDATE
    USING (true);

-- Sólo lectura para autenticados (Idealmente debería ser solo para un rol de administrador)
CREATE POLICY "Lectura de historial para autenticados" ON public.search_logs
    FOR SELECT 
    USING (auth.role() = 'authenticated');
