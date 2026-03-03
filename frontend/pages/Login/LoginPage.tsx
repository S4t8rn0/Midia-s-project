import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.png';

export const LoginPage: React.FC = () => {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isRegister) {
                if (!name.trim()) {
                    setError('Digite seu nome');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('A senha deve ter pelo menos 6 caracteres');
                    setLoading(false);
                    return;
                }
                const result = await register(name.trim(), email, password);
                if (result.error) {
                    setError(result.error);
                } else {
                    setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
                    setIsRegister(false);
                    setName('');
                    setPassword('');
                }
            } else {
                const result = await login(email, password);
                if (result.error) {
                    if (result.error.includes('Invalid login')) {
                        setError('Email ou senha incorretos');
                    } else if (result.error.includes('Email not confirmed')) {
                        setError('Confirme seu email antes de fazer login');
                    } else {
                        setError(result.error);
                    }
                }
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-church-950 via-church-900 to-church-800 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-accent-500 rounded-full blur-[200px] opacity-15"></div>
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-church-500 rounded-full blur-[200px] opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-church-600 rounded-full blur-[300px] opacity-10"></div>
                <div className="absolute bottom-20 right-1/3 w-[300px] h-[300px] bg-cyber-500 rounded-full blur-[200px] opacity-10"></div>
            </div>

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px',
                }}
            ></div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo / Brand */}
                <div className="text-center mb-6 animate-fade-in flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Mídia Comunicação"
                        className="w-56 h-auto drop-shadow-2xl"
                    />
                    <p className="text-church-300 text-sm mt-2">
                        {isRegister ? 'Crie sua conta para acessar o sistema' : 'Faça login para continuar'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20 animate-fade-in"
                    style={{ animationDelay: '100ms' }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-church-200 uppercase tracking-wider mb-2">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-church-400 p-3.5 rounded-xl focus:ring-2 focus:ring-cyber-500 focus:border-transparent focus:bg-white/10 outline-none transition-all"
                                    required
                                    autoFocus={isRegister}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-church-200 uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-church-400 p-3.5 rounded-xl focus:ring-2 focus:ring-cyber-500 focus:border-transparent focus:bg-white/10 outline-none transition-all"
                                required
                                autoFocus={!isRegister}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-church-200 uppercase tracking-wider mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-church-400 p-3.5 rounded-xl focus:ring-2 focus:ring-cyber-500 focus:border-transparent focus:bg-white/10 outline-none transition-all pr-12"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-church-400 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3.5 rounded-xl animate-fade-in">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-sm p-3.5 rounded-xl animate-fade-in">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-cyber-500 to-cyber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyber-500/30 hover:shadow-cyber-500/50 hover:from-cyber-600 hover:to-cyber-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isRegister ? (
                                <>
                                    <UserPlus size={18} />
                                    Criar Conta
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={switchMode}
                            className="text-church-300 text-sm hover:text-white transition-colors"
                        >
                            {isRegister ? (
                                <>Já tem conta? <span className="text-cyber-400 font-semibold">Faça login</span></>
                            ) : (
                                <>Não tem conta? <span className="text-cyber-400 font-semibold">Criar conta</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-church-500 text-xs mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    © {new Date().getFullYear()} MÍDIA comunicação • IPMC
                </p>
            </div>
        </div>
    );
};
