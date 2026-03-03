import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/user';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Flag para saber se o perfil foi verificado (mesmo que seja null)
    const [profileChecked, setProfileChecked] = useState(false);
    // Ref para acessar o user atual dentro de callbacks
    const userRef = useRef<User | null>(null);
    userRef.current = user;

    // Buscar perfil do usuário na tabela profiles
    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Erro ao buscar perfil:', error);
                return null;
            }
            return data as UserProfile;
        } catch (err) {
            console.error('Erro de rede ao buscar perfil:', err);
            return null;
        }
    }, []);

    // Função para recarregar o perfil do usuário atual
    const refreshProfile = useCallback(async () => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        const prof = await fetchProfile(currentUser.id);
        if (prof) {
            setProfile(prof);
        }
    }, [fetchProfile]);

    // Recarregar perfil quando a janela ganha foco (pega mudanças de role feitas no Supabase)
    useEffect(() => {
        const handleFocus = () => {
            if (userRef.current) {
                refreshProfile();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshProfile]);

    // Inicialização: verificar sessão existente
    useEffect(() => {
        let mounted = true;

        // Timeout de segurança — se não resolver em 3s, libera como não-autenticado
        const timeout = setTimeout(() => {
            if (mounted) {
                console.warn('Timeout de auth — liberando como não autenticado');
                // Limpar sessão antiga que pode estar causando o timeout
                supabase.auth.signOut().catch(() => { });
                setSession(null);
                setUser(null);
                setProfile(null);
                setIsLoading(false);
                setProfileChecked(true);
            }
        }, 3000);

        const initialize = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;
                clearTimeout(timeout);

                if (error || !session) {
                    // Sem sessão válida — limpar tudo
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileChecked(true);
                    setIsLoading(false);
                    return;
                }

                // Tem sessão — buscar perfil
                setSession(session);
                setUser(session.user);

                const prof = await fetchProfile(session.user.id);

                if (!mounted) return;

                if (prof) {
                    setProfile(prof);
                } else {
                    // Sessão existe mas perfil não — sessão inválida, deslogar
                    console.warn('Sessão sem perfil — fazendo logout');
                    await supabase.auth.signOut();
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }

                setProfileChecked(true);
                setIsLoading(false);
            } catch (err) {
                if (!mounted) return;
                clearTimeout(timeout);
                console.error('Erro ao inicializar auth:', err);
                setSession(null);
                setUser(null);
                setProfile(null);
                setProfileChecked(true);
                setIsLoading(false);
            }
        };

        initialize();

        // Listener para mudanças de auth (login, logout, token refresh)
        // IMPORTANTE: o callback NÃO pode ser async, porque o Supabase v2
        // aguarda (await) todos os callbacks do onAuthStateChange internamente.
        // Se o callback for async e fizer await, ele bloqueia signInWithPassword
        // de retornar, causando loading infinito no login.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT' || !newSession) {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileChecked(true);
                    setIsLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setSession(newSession);
                    setUser(newSession.user);

                    // Buscar perfil em background sem bloquear o retorno do callback
                    fetchProfile(newSession.user.id).then(prof => {
                        if (mounted) {
                            setProfile(prof);
                            setProfileChecked(true);
                            setIsLoading(false);
                        }
                    });
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Garantir que fica na tela de login em caso de erro
            setSession(null);
            setUser(null);
            setProfile(null);
            return { error: error.message };
        }
        return {};
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            return { error: error.message };
        }

        // Criar perfil na tabela profiles (caso o trigger não tenha criado)
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email,
                    name,
                    role: 'member',
                });

            if (profileError && !profileError.message.includes('duplicate')) {
                console.error('Erro ao criar perfil:', profileError);
            }
        }

        return {};
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    }, []);

    const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
        if (!user) return { error: 'Não autenticado' };

        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

        if (error) {
            return { error: error.message };
        }

        setProfile(prev => prev ? { ...prev, ...data } : null);
        return {};
    }, [user]);

    // Autenticado = tem sessão E tem perfil verificado com sucesso
    const isAuthenticated = !!session && !!profile && profileChecked;

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isAuthenticated,
        isAdmin: profile?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
}
