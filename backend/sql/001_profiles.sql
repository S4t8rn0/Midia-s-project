-- ========================================
-- TABELA: profiles (Perfis de usuários)
-- ========================================
-- Executar no SQL Editor do Supabase Dashboard

-- Criar tabela profiles vinculada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    phone VARCHAR(20),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ========================================
-- RLS (Row Level Security)
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ver todos os perfis
CREATE POLICY "Perfis visíveis para autenticados"
    ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Usuário pode atualizar apenas o próprio perfil
CREATE POLICY "Usuário atualiza próprio perfil"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Qualquer autenticado pode inserir seu próprio perfil
CREATE POLICY "Usuário cria próprio perfil"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================
-- FUNÇÃO: auto-criar perfil no registro
-- ========================================
-- Quando um user se registra via Supabase Auth,
-- cria automaticamente o perfil na tabela profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Membro'),
        'member'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
