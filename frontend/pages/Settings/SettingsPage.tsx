import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getGoogleCalendarStatus,
    getGoogleAuthUrl,
    disconnectGoogleCalendar
} from '../../services/googleCalendarService';
import {
    Settings,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Unplug,
    Plug,
    Shield,
    User,
    Mail,
    Globe
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { profile, isAdmin } = useAuth();

    // Google Calendar state
    const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Verificar parâmetros da URL (callback do Google OAuth)
    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

        if (params.get('google') === 'connected') {
            setStatusMessage({ type: 'success', text: 'Google Calendar conectado com sucesso! Todos os membros já podem ver os eventos.' });
            setGoogleConnected(true);
            window.location.hash = '#/settings';
            // Re-check status to get email
            getGoogleCalendarStatus().then(data => {
                setGoogleConnected(data.connected);
                setGoogleEmail(data.email || null);
            });
            setTimeout(() => setStatusMessage(null), 6000);
        }

        const error = params.get('error');
        if (error) {
            const errorMessages: Record<string, string> = {
                'google_auth_failed': 'Falha na autenticação com o Google. Tente novamente.',
                'missing_code': 'Código de autorização não recebido.',
                'missing_state': 'Estado da sessão perdido. Tente novamente.',
                'invalid_state': 'Estado da sessão inválido. Tente novamente.',
            };
            setStatusMessage({ type: 'error', text: errorMessages[error] || `Erro: ${error}` });
            window.location.hash = '#/settings';
            setTimeout(() => setStatusMessage(null), 8000);
        }
    }, []);

    // Verificar status da conexão Google Calendar
    useEffect(() => {
        async function checkStatus() {
            setIsLoading(true);
            const data = await getGoogleCalendarStatus();
            setGoogleConnected(data.connected);
            setGoogleEmail(data.email || null);
            setIsLoading(false);
        }
        checkStatus();
    }, []);

    // Conectar ao Google Calendar (admin)
    const handleConnect = async () => {
        setIsConnecting(true);
        const url = await getGoogleAuthUrl();
        if (url) {
            window.location.href = url;
        } else {
            setStatusMessage({ type: 'error', text: 'Não foi possível obter a URL de autenticação.' });
            setTimeout(() => setStatusMessage(null), 5000);
        }
        setIsConnecting(false);
    };

    // Desconectar do Google Calendar (admin)
    const handleDisconnect = async () => {
        if (!confirm('Deseja realmente desconectar do Google Calendar? Nenhum membro poderá ver os eventos do Google.')) return;

        setIsDisconnecting(true);
        const ok = await disconnectGoogleCalendar();
        if (ok) {
            setGoogleConnected(false);
            setGoogleEmail(null);
            setStatusMessage({ type: 'success', text: 'Google Calendar desconectado.' });
        } else {
            setStatusMessage({ type: 'error', text: 'Erro ao desconectar. Tente novamente.' });
        }
        setIsDisconnecting(false);
        setTimeout(() => setStatusMessage(null), 5000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 rounded-xl bg-church-800">
                        <Settings size={22} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-church-900 tracking-tight">Configurações</h1>
                            <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">Gerencie suas integrações e preferências</p>
                    </div>
                </div>
            </header>

            {/* Status Messages */}
            {statusMessage && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${statusMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {statusMessage.type === 'success'
                        ? <CheckCircle2 size={20} className="flex-shrink-0" />
                        : <XCircle size={20} className="flex-shrink-0" />
                    }
                    <p className="text-sm font-medium">{statusMessage.text}</p>
                </div>
            )}

            {/* Perfil do Usuário */}
            <section className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 mb-8">
                <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-church-600" />
                    Perfil
                </h2>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl border-2 border-cyber-500 shadow-lg bg-church-700 flex items-center justify-center text-white font-bold text-2xl">
                        {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{profile?.name || 'Usuário'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-gray-500 text-sm">{profile?.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Shield size={14} className={isAdmin ? 'text-cyber-500' : 'text-gray-400'} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-cyber-600' : 'text-gray-400'}`}>
                                {isAdmin ? 'Administrador' : 'Membro'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Google Calendar Integration */}
            <section className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
                <h2 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar size={20} className="text-church-600" />
                    Google Calendar
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                    Conecte a conta Google da mídia para sincronizar eventos para todos os membros.
                </p>

                {isLoading ? (
                    <div className="flex items-center gap-3 py-6 justify-center">
                        <Loader2 size={24} className="text-cyber-500 animate-spin" />
                        <span className="text-gray-500 text-sm">Verificando conexão...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={`p-5 rounded-2xl border-2 transition-all ${googleConnected
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${googleConnected
                                        ? 'bg-emerald-100'
                                        : 'bg-gray-200'
                                        }`}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Google Calendar</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {googleConnected ? (
                                                <>
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-emerald-600 text-xs font-semibold">Conectado</span>
                                                    {googleEmail && (
                                                        <span className="text-gray-400 text-xs ml-1">• {googleEmail}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    <span className="text-gray-500 text-xs font-semibold">Desconectado</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Only admin can connect/disconnect */}
                                {isAdmin && (
                                    googleConnected ? (
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={isDisconnecting}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isDisconnecting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Unplug size={16} />
                                            )}
                                            {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleConnect}
                                            disabled={isConnecting}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-500 text-white hover:bg-cyber-600 shadow-lg shadow-cyber-500/20 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isConnecting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Plug size={16} />
                                            )}
                                            {isConnecting ? 'Conectando...' : 'Conectar Conta Google'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Info for non-admins */}
                        {!isAdmin && !googleConnected && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                                <p className="text-amber-700 text-sm flex items-center gap-2">
                                    <Shield size={14} />
                                    <span>Apenas administradores podem conectar o Google Calendar.</span>
                                </p>
                            </div>
                        )}

                        {/* Info */}
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                            <h4 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-1.5">
                                <Globe size={14} />
                                Como funciona?
                            </h4>
                            <ul className="text-blue-700 text-xs space-y-1.5 ml-5 list-disc">
                                <li>Um administrador conecta a <strong>conta Google da mídia</strong> uma única vez.</li>
                                <li>Após conectar, <strong>todos os membros</strong> veem os eventos do calendário sincronizados.</li>
                                <li>Os eventos aparecem no Dashboard e na contagem de "Eventos do Mês".</li>
                                <li>Os tokens são armazenados de forma segura no banco de dados.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
