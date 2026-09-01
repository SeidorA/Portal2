-- Script para crear la tabla de Novedades

CREATE TABLE IF NOT EXISTS public.novedades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad simples (lectura pública, escritura privada)
CREATE POLICY "Novedades son visibles para todos" ON public.novedades
    FOR SELECT USING (true);

CREATE POLICY "Solo usuarios autenticados pueden modificar novedades" ON public.novedades
    FOR ALL USING (auth.role() = 'authenticated');
