import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import fundoLogin from '../../assets/fundo_login.png';
import '../../styles/login.css';

type LoginMode = 'login' | 'register';

// ── Inline SVG Icons ──────────────────────────────
const PersonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const ErrorAlertIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ArrowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// ── LoginPage Component ────────────────────────────
export const LoginPage: React.FC = () => {
    const { login, register } = useAuth();

    // Mode
    const [mode, setMode] = useState<LoginMode>('login');
    const [textKey, setTextKey] = useState(0);

    // Login form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Register form state
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [regError, setRegError] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regSuccess, setRegSuccess] = useState('');

    // Background
    const [bgLoaded, setBgLoaded] = useState(false);

    // Typewriter
    const [typedText, setTypedText] = useState('');
    const [isTypingDone, setIsTypingDone] = useState(false);
    const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mode-dependent texts
    const bgTitle = mode === 'login' ? 'Bem-vindo!' : 'Junte-se a nós!';
    const bgSubtitleText = mode === 'login'
        ? 'Gerencie a mídia da sua igreja'
        : 'Crie sua conta e comece a colaborar';

    // ── Typewriter Effect ──
    useEffect(() => {
        setTypedText('');
        setIsTypingDone(false);
        let currentIndex = 0;

        const startDelay = setTimeout(() => {
            const typeNextChar = () => {
                if (currentIndex < bgSubtitleText.length) {
                    currentIndex++;
                    setTypedText(bgSubtitleText.slice(0, currentIndex));
                    typingRef.current = setTimeout(typeNextChar, 40);
                } else {
                    setIsTypingDone(true);
                }
            };
            typeNextChar();
        }, 800);

        return () => {
            clearTimeout(startDelay);
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, [mode, bgSubtitleText]);

    // ── Switch mode ──
    const switchMode = useCallback((newMode: LoginMode) => {
        setMode(newMode);
        setTextKey(prev => prev + 1);
        setError('');
        setRegError('');
        setRegSuccess('');
    }, []);

    // ── Login handler ──
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
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
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // ── Register handler ──
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError('');
        setRegSuccess('');
        setRegLoading(true);
        try {
            if (!regName.trim()) {
                setRegError('Digite seu nome');
                setRegLoading(false);
                return;
            }
            if (regPassword.length < 6) {
                setRegError('A senha deve ter pelo menos 6 caracteres');
                setRegLoading(false);
                return;
            }
            const result = await register(regName.trim(), regEmail, regPassword);
            if (result.error) {
                setRegError(result.error);
            } else {
                setRegSuccess('Conta criada com sucesso! Verifique seu email.');
                setTimeout(() => switchMode('login'), 2500);
            }
        } catch {
            setRegError('Erro inesperado. Tente novamente.');
        } finally {
            setRegLoading(false);
        }
    };

    // ── Render ──
    return (
        <div className={`login-container login-container--${mode}`}>
            {/* ── Background Panel ── */}
            <div className="login-left-panel">
                <img
                    src={fundoLogin}
                    alt="Background"
                    className={`login-background-image${bgLoaded ? ' login-bg-loaded' : ''}`}
                    onLoad={() => setBgLoaded(true)}
                />
                <div className="login-left-overlay" />

                {/* Decorative elements */}
                <div className="login-decorative-dots login-decorative-dots-top" />
                <div className="login-decorative-dots login-decorative-dots-bottom" />
                <div className="login-decorative-plus login-decorative-plus-1">+</div>
                <div className="login-decorative-plus login-decorative-plus-2">+</div>
                <div className="login-decorative-circle login-decorative-circle-1" />
                <div className="login-decorative-circle login-decorative-circle-2" />

                {/* Content: logo + title + typewriter */}
                <div className="login-bg-content">
                    <div className="login-bg-header" key={`bg-logo-${textKey}`}>
                        <img src={logo} alt="Mídia Comunicação" className="login-bg-logo login-text-fade" />
                    </div>
                    <div className="login-bg-body" style={{ paddingBottom: '160px' }}>
                        <div className="login-welcome-content" key={`bg-text-${textKey}`}>
                            <h1 className="login-welcome-title login-text-fade">{bgTitle}</h1>
                            <p className={`login-welcome-subtitle login-text-fade${!isTypingDone ? ' login-typing-cursor' : ''}`}>
                                {typedText}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer on background */}
                <div className="login-footer">
                    © {new Date().getFullYear()} MÍDIA comunicação • IPMC
                </div>
            </div>

            {/* ── Form Panel (slides via CSS) ── */}
            <div className="login-form-panel">
                {mode === 'login' ? (
                    <div className="login-form-card">
                        <div className="login-logo-section">
                            <img src={logo} alt="Mídia Comunicação" className="login-logo-image" />
                        </div>
                        <h2 className="login-form-title">Faça seu Login</h2>

                        <form className="login-form" onSubmit={handleLogin}>
                            {error && (
                                <div className="login-error-alert">
                                    <ErrorAlertIcon />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="login-input-group">
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon"><MailIcon /></span>
                                    <input
                                        type="email"
                                        className="login-input"
                                        placeholder="Seu email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="login-input-group">
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon"><LockIcon /></span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="login-input"
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="login-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="login-options-row">
                                <label className="login-remember-me">
                                    <input
                                        type="checkbox"
                                        className="login-checkbox"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                    />
                                    <span className="login-checkbox-custom" />
                                    <span>Lembrar-me</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={`login-submit-button${loading ? ' login-submit-loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="login-loading-spinner" />
                                ) : (
                                    <>
                                        <span>Entrar</span>
                                        <ArrowIcon />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-switch-section">
                            <span>Não tem conta?</span>
                            <button className="login-switch-mode" onClick={() => switchMode('register')}>
                                Criar conta
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="login-form-card">
                        <div className="login-logo-section">
                            <img src={logo} alt="Mídia Comunicação" className="login-logo-image" />
                        </div>
                        <h2 className="login-form-title">Criar Conta</h2>

                        <form className="login-form" onSubmit={handleRegister}>
                            {regError && (
                                <div className="login-error-alert">
                                    <ErrorAlertIcon />
                                    <span>{regError}</span>
                                </div>
                            )}

                            {regSuccess && (
                                <div className="login-success-alert">
                                    <span>{regSuccess}</span>
                                </div>
                            )}

                            <div className="login-input-group">
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon"><PersonIcon /></span>
                                    <input
                                        type="text"
                                        className="login-input"
                                        placeholder="Seu nome completo"
                                        value={regName}
                                        onChange={e => setRegName(e.target.value)}
                                        required
                                        autoFocus
                                        disabled={regLoading}
                                    />
                                </div>
                            </div>

                            <div className="login-input-group">
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon"><MailIcon /></span>
                                    <input
                                        type="email"
                                        className="login-input"
                                        placeholder="Seu email"
                                        value={regEmail}
                                        onChange={e => setRegEmail(e.target.value)}
                                        required
                                        disabled={regLoading}
                                    />
                                </div>
                            </div>

                            <div className="login-input-group">
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon"><LockIcon /></span>
                                    <input
                                        type={showRegPassword ? 'text' : 'password'}
                                        className="login-input"
                                        placeholder="Crie uma senha (min. 6 caracteres)"
                                        value={regPassword}
                                        onChange={e => setRegPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={regLoading}
                                    />
                                    <button
                                        type="button"
                                        className="login-password-toggle"
                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                        tabIndex={-1}
                                    >
                                        {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`login-submit-button${regLoading ? ' login-submit-loading' : ''}`}
                                disabled={regLoading}
                            >
                                {regLoading ? (
                                    <div className="login-loading-spinner" />
                                ) : (
                                    <>
                                        <span>Criar Conta</span>
                                        <ArrowIcon />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-switch-section">
                            <span>Já tem conta?</span>
                            <button className="login-switch-mode" onClick={() => switchMode('login')}>
                                Faça login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
