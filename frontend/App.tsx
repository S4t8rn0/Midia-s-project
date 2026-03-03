import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { fetchUpcomingEvent, fetchMonthEventsCount, EventData } from './services/calendar';
import { Sidebar } from './components/Sidebar';
import { CalendarPage } from './pages/Calendar/CalendarPage.tsx';
import { KanbanPage } from './pages/Kanban/KanbanPage.tsx';
import { GalleryPage } from './pages/Galery/GalleryPage.tsx';
import { MembersPage } from './pages/Members/MembersPage.tsx';
import { SettingsPage } from './pages/Settings/SettingsPage.tsx';
import { LoginPage } from './pages/Login/LoginPage.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Bell, Search, Calendar as CalendarIcon, CheckCircle2, Image as ImageIcon, ArrowUpRight, Users, Lightbulb, Play, Eye, AlertTriangle, Info, Plus, X, Trash2, Edit, Megaphone, Loader2 } from 'lucide-react';
import { Task, TaskStatus, Aviso, AvisoPriority, DEFAULT_AVISOS, CalendarEvent, Member, MOCK_MEMBERS } from './types';

type StatCardProps = {
    title: string;
    value: React.ReactNode;
    subtitle?: React.ReactNode;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;
    colorClass?: string;
    delay?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, colorClass = 'bg-gray-200', delay = '0ms' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in`} style={{ animationDelay: delay }}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${(colorClass || '').replace('bg-', 'text-')}`} />
            </div>
            <span className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                Hoje <ArrowUpRight size={10} className="ml-1" />
            </span>
        </div>
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 tracking-tight">{value}</p>
        <p className="text-gray-400 text-xs mt-2 font-medium">{subtitle}</p>
    </div>
);

function DashboardHome() {
    const { profile, isAdmin } = useAuth();
    const [query, setQuery] = useState('');

    // Carregar tarefas do localStorage (compartilhado com Kanban)
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const saved = localStorage.getItem('tasks');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // Escutar mudanças no localStorage
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'tasks') {
                try { setTasks(e.newValue ? JSON.parse(e.newValue) : []); } catch { }
            }
        };
        const interval = setInterval(() => {
            const saved = localStorage.getItem('tasks');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setTasks(prev => JSON.stringify(prev) !== saved ? parsed : prev);
                } catch { }
            }
        }, 2000);
        window.addEventListener('storage', onStorage);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    const ideasCount = tasks.filter(t => t.status === TaskStatus.IDEAS).length;
    const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const reviewCount = tasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const pendingTotal = ideasCount + inProgressCount + reviewCount;

    // Carregar avisos do localStorage (compartilhado com AvisosPage)
    const [avisos, setAvisos] = useState<Aviso[]>(() => {
        try {
            const saved = localStorage.getItem('avisos');
            return saved ? JSON.parse(saved) : DEFAULT_AVISOS;
        } catch { return DEFAULT_AVISOS; }
    });

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'avisos') {
                try { setAvisos(e.newValue ? JSON.parse(e.newValue) : DEFAULT_AVISOS); } catch { }
            }
        };
        const interval = setInterval(() => {
            const saved = localStorage.getItem('avisos');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setAvisos(prev => JSON.stringify(prev) !== saved ? parsed : prev);
                } catch { }
            }
        }, 2000);
        window.addEventListener('storage', onStorage);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    // Carregar eventos do localStorage (compartilhado com CalendarPage)
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
        try {
            const saved = localStorage.getItem('events');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // Carregar membros do localStorage
    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const saved = localStorage.getItem('members');
            return saved ? JSON.parse(saved) as Member[] : MOCK_MEMBERS;
        } catch { return MOCK_MEMBERS; }
    });

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'events') {
                try { setCalendarEvents(e.newValue ? JSON.parse(e.newValue) : []); } catch { }
            }
            if (e.key === 'members') {
                try { setMembers(e.newValue ? JSON.parse(e.newValue) : MOCK_MEMBERS); } catch { }
            }
        };
        const interval = setInterval(() => {
            const savedEv = localStorage.getItem('events');
            if (savedEv) {
                try {
                    const parsed = JSON.parse(savedEv);
                    setCalendarEvents(prev => JSON.stringify(prev) !== savedEv ? parsed : prev);
                } catch { }
            }
            const savedMb = localStorage.getItem('members');
            if (savedMb) {
                try {
                    const parsed = JSON.parse(savedMb);
                    setMembers(prev => JSON.stringify(prev) !== savedMb ? parsed : prev);
                } catch { }
            }
        }, 2000);
        window.addEventListener('storage', onStorage);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    // Eventos de hoje e membros escalados
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayEvents = calendarEvents.filter(e => e.date === todayStr);
    const todayAssigneeIds = [...new Set(todayEvents.flatMap(e => e.assigneeIds || []))];
    const todayMembers = todayAssigneeIds
        .map(id => members.find(m => m.id === id))
        .filter(Boolean) as Member[];

    // Próximo evento do calendário (data >= hoje)
    const nextEvent = React.useMemo(() => {
        const upcoming = calendarEvents
            .filter(e => e.date && e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));
        return upcoming.length > 0 ? upcoming[0] : null;
    }, [calendarEvents, todayStr]);

    // Formatar dados do próximo evento para o Hero Card
    const nextEventDisplay = React.useMemo(() => {
        if (!nextEvent) return null;
        const [year, month, day] = nextEvent.date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const typeLabels: Record<string, string> = { SERVICE: 'Culto', EVENT: 'Evento', HOLIDAY: 'Feriado' };
        return {
            title: nextEvent.title,
            subtitle: `${dayNames[eventDate.getDay()]}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')} • ${typeLabels[nextEvent.type] || nextEvent.type}`,
            monthName: monthNames[month - 1],
            day: String(day).padStart(2, '0'),
            dayOfWeek: dayNames[eventDate.getDay()],
            description: nextEvent.description || '',
        };
    }, [nextEvent]);

    // Eventos do mês atual (sincronizado com Google Calendar)
    const [googleMonthTotal, setGoogleMonthTotal] = useState<number | null>(null);

    useEffect(() => {
        fetchMonthEventsCount(currentYear, currentMonth + 1).then(data => {
            if (data.total > 0) {
                setGoogleMonthTotal(data.total);
            } else {
                setGoogleMonthTotal(null); // fallback para eventos locais
            }
        });
    }, [currentYear, currentMonth]);

    // Fallback: eventos locais do mês caso Google Calendar não esteja disponível
    const localMonthEvents = calendarEvents.filter(e => {
        if (!e.date) return false;
        const [y, m] = e.date.split('-').map(Number);
        return y === currentYear && m === currentMonth + 1;
    });
    const monthEventsCount = googleMonthTotal !== null ? googleMonthTotal : localMonthEvents.length;
    const monthSpecialCount = localMonthEvents.filter(e => e.type === 'EVENT' || e.type === 'HOLIDAY').length;

    // Contagem de membros escalados na semana atual
    const weeklyScheduleCount = React.useMemo(() => {
        // Calcular início (domingo) e fim (sábado) da semana atual
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

        // Buscar eventos da semana (locais)
        const weekEvents = calendarEvents.filter(e => e.date && e.date >= weekStartStr && e.date <= weekEndStr);
        const localAssignees = weekEvents.flatMap(e => e.assigneeIds || []);

        // Buscar assignees do Google Calendar salvos no localStorage
        let googleAssignees: string[] = [];
        try {
            const saved = localStorage.getItem('googleEventAssignees');
            if (saved) {
                const map = JSON.parse(saved) as Record<string, string[]>;
                googleAssignees = Object.values(map).flat();
            }
        } catch { }

        // Contar membros únicos
        const allAssignees = new Set([...localAssignees, ...googleAssignees]);
        return allAssignees.size;
    }, [calendarEvents]);

    // CRUD state for avisos
    const [showAvisoModal, setShowAvisoModal] = useState(false);
    const [editingAvisoId, setEditingAvisoId] = useState<string | null>(null);
    const [avisoTitle, setAvisoTitle] = useState('');
    const [avisoMessage, setAvisoMessage] = useState('');
    const [avisoPriority, setAvisoPriority] = useState<AvisoPriority>('info');
    const [avisoAuthor, setAvisoAuthor] = useState('');

    // Persist avisos to localStorage
    useEffect(() => {
        localStorage.setItem('avisos', JSON.stringify(avisos));
    }, [avisos]);

    const resetAvisoForm = () => {
        setShowAvisoModal(false);
        setEditingAvisoId(null);
        setAvisoTitle('');
        setAvisoMessage('');
        setAvisoPriority('info');
        setAvisoAuthor('');
    };

    const handleSaveAviso = () => {
        if (!avisoTitle.trim() || !avisoMessage.trim()) return;
        if (editingAvisoId) {
            setAvisos(prev => prev.map(a => a.id === editingAvisoId ? {
                ...a,
                title: avisoTitle.trim(),
                message: avisoMessage.trim(),
                priority: avisoPriority,
                author: avisoAuthor.trim() || 'Anônimo',
            } : a));
        } else {
            const newAviso: Aviso = {
                id: Date.now().toString(),
                title: avisoTitle.trim(),
                message: avisoMessage.trim(),
                priority: avisoPriority,
                author: avisoAuthor.trim() || profile?.name || 'Anônimo',
                createdAt: new Date().toISOString(),
            };
            setAvisos(prev => [newAviso, ...prev]);
        }
        resetAvisoForm();
    };

    const openEditAviso = (aviso: Aviso) => {
        setEditingAvisoId(aviso.id);
        setAvisoTitle(aviso.title);
        setAvisoMessage(aviso.message);
        setAvisoPriority(aviso.priority);
        setAvisoAuthor(aviso.author);
        setShowAvisoModal(true);
    };

    const handleDeleteAviso = (id: string) => {
        if (!confirm('Excluir este aviso?')) return;
        setAvisos(prev => prev.filter(a => a.id !== id));
    };

    const PRIORITY_CONFIG: Record<AvisoPriority, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
        urgent: { label: 'Importante', icon: <AlertTriangle size={14} />, bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-100' },
        info: { label: 'Informativo', icon: <Info size={14} />, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        idea: { label: 'Ideia', icon: <Lightbulb size={14} />, bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    };

    const [message, setMessage] = useState('');
    const highlightRef = useRef<HTMLElement | null>(null);
    const navigate = useNavigate();

    const clearHighlight = () => {
        if (highlightRef.current) {
            highlightRef.current.style.boxShadow = '';
            highlightRef.current = null;
        }
    };

    const [upcomingEvent, setUpcomingEvent] = useState<EventData | null | undefined>(undefined);
    const [authUrl, setAuthUrl] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifText, setNotifText] = useState('');

    useEffect(() => {
        fetchUpcomingEvent().then(res => {
            if (res.unauthorized) {
                setAuthUrl(res.authUrl || '');
                setUpcomingEvent(null);
            } else {
                setUpcomingEvent(res.event ?? null);
            }
        }).catch(() => setUpcomingEvent(null));
    }, []);

    const handleNotify = async () => {
        // if we already have an event, show it
        if (upcomingEvent) {
            const text = `${upcomingEvent.title} — ${upcomingEvent.date}. Escalados: ${upcomingEvent.attendees.join(', ')}`;
            setNotifText(text);
            setNotifOpen(true);

            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(upcomingEvent.title, { body: `${upcomingEvent.date} — ${upcomingEvent.attendees.join(', ')}` });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(p => {
                        if (p === 'granted') new Notification(upcomingEvent.title, { body: `${upcomingEvent.date} — ${upcomingEvent.attendees.join(', ')}` });
                    });
                }
            }

            setTimeout(() => setNotifOpen(false), 4000);
            return;
        }

        // If not authenticated, start auth flow
        if (authUrl) {
            window.open(authUrl, '_blank');
            return;
        }

        // fallback: try fetching again
        const res = await fetchUpcomingEvent();
        if (res.unauthorized && res.authUrl) {
            window.open(res.authUrl, '_blank');
            return;
        }

        if (res.event) {
            setUpcomingEvent(res.event);
            const text = `${res.event.title} — ${res.event.date}. Escalados: ${res.event.attendees.join(', ')}`;
            setNotifText(text);
            setNotifOpen(true);
            setTimeout(() => setNotifOpen(false), 4000);
            return;
        }

        setNotifText('Nenhum evento próximo');
        setNotifOpen(true);
        setTimeout(() => setNotifOpen(false), 2500);
    };

    const handleSearch = (q?: string) => {
        const term = (q ?? query).trim();
        if (!term) return;

        // 1) procurar no DOM por texto correspondente
        const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
        const found = all.find(el => {
            const txt = el.innerText || '';
            return txt.toLowerCase().includes(term.toLowerCase());
        });

        if (found) {
            // rolar até o elemento e destacar
            found.scrollIntoView({ behavior: 'smooth', block: 'center' });
            clearHighlight();
            found.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.25)';
            highlightRef.current = found;
            setMessage('');
            // remover destaque depois de 2.5s
            setTimeout(() => clearHighlight(), 2500);
            return;
        }

        // 2) tentar mapear para rotas conhecidas
        const map: Array<{ keywords: string[]; path: string }> = [
            { keywords: ['calend', 'evento', 'agenda'], path: '/calendar' },
            { keywords: ['kanban', 'taref'], path: '/kanban' },
            { keywords: ['galer', 'gallery', 'galery', 'foto', 'imagem'], path: '/gallery' },
            { keywords: ['membro', 'member', 'escala'], path: '/members' },
        ];

        const lower = term.toLowerCase();
        const route = map.find(m => m.keywords.some(k => lower.includes(k)));
        if (route) {
            setMessage('');
            navigate(route.path);
            return;
        }

        // 3) se nada, mostrar mensagem
        setMessage('Não encontrado');
        setTimeout(() => setMessage(''), 2500);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-4xl font-bold text-church-900 tracking-tight">
                            Olá, {profile?.name?.split(' ')[0] || 'Time'}!
                        </h1>
                        <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
                    </div>
                    <p className="text-gray-500 mt-1">Aqui está o resumo das atividades da mídia para hoje.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            className="pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-soft focus:ring-2 focus:ring-cyber-500 w-64 text-sm"
                        />
                        {/* feedback */}
                        {message && (
                            <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 text-sm text-gray-700 rounded-md px-3 py-2 shadow">
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={handleNotify} className="p-2.5 bg-white rounded-xl shadow-soft text-gray-500 hover:text-cyber-500 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* Notificação popover rendered outside button to avoid nested button issue */}
                        {notifOpen && (
                            <div className="absolute right-0 mt-12 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-800 z-50">
                                <div className="font-bold text-gray-900 mb-1">Próximo evento</div>
                                <div className="text-xs mb-2">{notifText}</div>
                                <div className="text-right">
                                    <button onClick={(e) => { e.stopPropagation(); setNotifOpen(false); }} className="text-cyber-500 text-xs font-medium">Fechar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Card — Próximo Evento sincronizado com calendário */}
            <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl relative bg-church-800 text-white">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-church-600 to-transparent opacity-50"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-500 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-cyber-500 rounded-full blur-[120px] opacity-20"></div>

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium mb-4">
                            <span className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse"></span>
                            Próximo Evento
                        </div>
                        {nextEventDisplay ? (
                            <>
                                <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{nextEventDisplay.title}</h2>
                                <p className="text-church-100 text-lg mb-2 max-w-md">{nextEventDisplay.subtitle}</p>
                                {nextEventDisplay.description && (
                                    <p className="text-church-200 text-sm mb-6 max-w-md">{nextEventDisplay.description}</p>
                                )}
                                {!nextEventDisplay.description && <div className="mb-6" />}
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight opacity-60">Sem eventos</h2>
                                <p className="text-church-100 text-lg mb-6 max-w-md">Nenhum evento próximo agendado</p>
                            </>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => navigate('/calendar')} className="px-6 py-3 bg-cyber-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-cyber-600 transition-colors">
                                Ver Escala
                            </button>
                            <button onClick={() => navigate('/kanban')} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors">
                                Tarefas
                            </button>
                        </div>
                    </div>

                    {/* Quick Date — sincronizado */}
                    {nextEventDisplay ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full md:w-auto text-center min-w-[140px]">
                            <span className="block text-cyber-400 font-bold uppercase text-sm tracking-wider mb-1">{nextEventDisplay.monthName}</span>
                            <span className="block text-5xl font-bold">{nextEventDisplay.day}</span>
                            <span className="block text-church-200 text-sm mt-1">{nextEventDisplay.dayOfWeek}</span>
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full md:w-auto text-center min-w-[140px]">
                            <span className="block text-cyber-400 font-bold uppercase text-sm tracking-wider mb-1">—</span>
                            <span className="block text-5xl font-bold opacity-30">--</span>
                            <span className="block text-church-200 text-sm mt-1">—</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Tarefas Pendentes"
                    value={String(pendingTotal).padStart(2, '0')}
                    subtitle={
                        <span className="flex items-center gap-3 mt-1">
                            <span className="inline-flex items-center gap-1" title="Ideias">
                                <Lightbulb size={10} className="text-yellow-500" />
                                <span>{ideasCount}</span>
                            </span>
                            <span className="inline-flex items-center gap-1" title="Em Andamento">
                                <Play size={10} className="text-blue-500" />
                                <span>{inProgressCount}</span>
                            </span>
                            <span className="inline-flex items-center gap-1" title="Análise">
                                <Eye size={10} className="text-purple-500" />
                                <span>{reviewCount}</span>
                            </span>
                        </span>
                    }
                    icon={CheckCircle2}
                    colorClass="bg-accent-500"
                    delay="0ms"
                />
                <StatCard
                    title="Escala da Semana"
                    value={String(weeklyScheduleCount).padStart(2, '0')}
                    subtitle="Membros escalados"
                    icon={Users}
                    colorClass="bg-church-500"
                    delay="100ms"
                />
                <StatCard
                    title="Galeria"
                    value="1.2k"
                    subtitle="+45 essa semana"
                    icon={ImageIcon}
                    colorClass="bg-cyber-500"
                    delay="200ms"
                />
                <StatCard
                    title="Eventos do Mês"
                    value={String(monthEventsCount).padStart(2, '0')}
                    subtitle={
                        googleMonthTotal !== null
                            ? `Via Google Calendar`
                            : `${monthSpecialCount} Especiai${monthSpecialCount === 1 ? '' : 's'}`
                    }
                    icon={CalendarIcon}
                    colorClass="bg-cyber-600"
                    delay="300ms"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-900">Avisos</h3>
                        {isAdmin && (
                            <button
                                onClick={() => { resetAvisoForm(); setShowAvisoModal(true); }}
                                className="bg-accent-500 text-white px-3 py-2 rounded-xl hover:bg-accent-600 shadow-lg shadow-accent-500/20 flex items-center gap-1.5 transition-all active:scale-95 font-medium text-xs"
                            >
                                <Plus size={14} />
                                Novo Aviso
                            </button>
                        )}
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {avisos.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium text-sm">Nenhum aviso publicado</p>
                                <p className="text-xs mt-1">Clique em "Novo Aviso" para criar o primeiro.</p>
                            </div>
                        )}
                        {avisos.map(aviso => {
                            const cfg = PRIORITY_CONFIG[aviso.priority];
                            const timeAgo = (() => {
                                const diffMs = Date.now() - new Date(aviso.createdAt).getTime();
                                const diffMin = Math.floor(diffMs / 60000);
                                if (diffMin < 1) return 'Agora';
                                if (diffMin < 60) return `Há ${diffMin} min`;
                                const diffH = Math.floor(diffMin / 60);
                                if (diffH < 24) return `Há ${diffH}h`;
                                const diffD = Math.floor(diffH / 24);
                                if (diffD === 1) return 'Ontem';
                                return `Há ${diffD} dias`;
                            })();
                            return (
                                <div key={aviso.id} className={`flex items-start gap-4 p-4 rounded-2xl ${cfg.bg} border ${cfg.border} hover:shadow-md transition-all group`}>
                                    <div className={`w-10 h-10 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.text} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-900 text-sm">{aviso.title}</h4>
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{aviso.message}</p>
                                        <span className="text-xs text-gray-400 mt-2 block">{timeAgo} • Por {aviso.author}</span>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button
                                                onClick={() => openEditAviso(aviso)}
                                                className="p-2 text-gray-300 hover:text-church-700 hover:bg-church-50 rounded-full transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAviso(aviso.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
                    <h3 className="font-bold text-xl text-gray-900 mb-6">Próxima Escala</h3>
                    <div className="space-y-5">
                        {(() => {
                            // Buscar próximos eventos (hoje ou futuro) ordenados
                            const upcomingEvents = calendarEvents
                                .filter(e => e.date && e.date >= todayStr)
                                .sort((a, b) => a.date.localeCompare(b.date));

                            if (upcomingEvents.length === 0) {
                                return <p className="text-gray-400 text-sm text-center py-4">Nenhum evento agendado.</p>;
                            }

                            // Pegar o próximo evento
                            const nextEv = upcomingEvents[0];
                            const [ny, nm, nd] = nextEv.date.split('-').map(Number);
                            const evDate = new Date(ny, nm - 1, nd);
                            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                            const isToday = nextEv.date === todayStr;

                            // Membros escalados: locais + Google Calendar
                            let assigneeIds = [...(nextEv.assigneeIds || [])];
                            try {
                                const saved = localStorage.getItem('googleEventAssignees');
                                if (saved) {
                                    const map = JSON.parse(saved) as Record<string, string[]>;
                                    if (map[nextEv.id]) {
                                        assigneeIds = [...new Set([...assigneeIds, ...map[nextEv.id]])];
                                    }
                                }
                            } catch { }
                            const scheduledMembers = assigneeIds
                                .map(id => members.find(m => m.id === id))
                                .filter(Boolean) as Member[];

                            const typeColors: Record<string, string> = {
                                SERVICE: 'bg-church-50 border-church-500 text-church-700',
                                EVENT: 'bg-accent-50 border-accent-500 text-accent-700',
                                HOLIDAY: 'bg-cyber-50 border-cyber-500 text-cyber-700',
                            };

                            return (
                                <>
                                    {/* Card do evento */}
                                    <div className={`p-4 rounded-xl border-l-4 ${typeColors[nextEv.type] || typeColors.EVENT}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">{nextEv.title}</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isToday ? 'bg-cyber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {isToday ? 'Hoje' : `${dayNames[evDate.getDay()]}, ${String(nd).padStart(2, '0')}/${String(nm).padStart(2, '0')}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Membros escalados */}
                                    {scheduledMembers.length === 0 ? (
                                        <p className="text-gray-400 text-xs text-center">Nenhum membro escalado para este evento.</p>
                                    ) : (
                                        scheduledMembers.map(member => {
                                            const palette = ['bg-cyber-500', 'bg-church-600', 'bg-church-700', 'bg-church-800', 'bg-church-500'];
                                            const hash = (member.name?.charCodeAt(0) || 0) + (member.name?.length || 0);
                                            const avatarColor = palette[hash % palette.length];
                                            const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : '?';

                                            return (
                                                <div key={member.id} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyber-500 to-church-600 flex items-center justify-center flex-shrink-0">
                                                        <div className={`${avatarColor} w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white`}>{initial}</div>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-800 text-sm">{member.name}</h5>
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {member.roles.map(role => (
                                                                <span key={role} className="inline-block px-2 py-0.5 rounded-md bg-church-50 text-church-600 text-[10px] font-bold uppercase tracking-wide border border-church-100">
                                                                    {role}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                    {/* Outros eventos próximos */}
                                    {upcomingEvents.length > 1 && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400 mb-2">Próximos</p>
                                            <div className="space-y-1.5">
                                                {upcomingEvents.slice(1, 4).map(ev => {
                                                    const [ey, em, ed] = ev.date.split('-').map(Number);
                                                    const eDate = new Date(ey, em - 1, ed);
                                                    return (
                                                        <div key={ev.id} className={`text-xs p-2.5 rounded-xl border-l-4 ${typeColors[ev.type] || typeColors.EVENT}`}>
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold">{ev.title}</span>
                                                                <span className="text-[10px] opacity-70">{dayNames[eDate.getDay()]}, {String(ed).padStart(2, '0')}/{String(em).padStart(2, '0')}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        <button
                            onClick={() => navigate('/calendar')}
                            className="w-full py-3 rounded-xl border border-cyber-100 bg-cyber-500/5 text-cyber-600 text-sm font-medium hover:bg-cyber-500 hover:text-white transition-colors mt-4"
                        >
                            Ver escala completa
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Aviso */}
            {showAvisoModal && (
                <div className="fixed inset-0 bg-church-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative">
                        <button onClick={resetAvisoForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>

                        <div className="mb-6">
                            <span className="text-cyber-500 text-xs font-bold uppercase tracking-widest">IPMC Mídia</span>
                            <h3 className="font-bold text-2xl text-gray-900 mt-1">{editingAvisoId ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Título</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                    placeholder="Ex: Reunião de pauta"
                                    value={avisoTitle}
                                    onChange={e => setAvisoTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mensagem</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800 resize-none h-24"
                                    placeholder="Detalhes do aviso..."
                                    value={avisoMessage}
                                    onChange={e => setAvisoMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Prioridade</label>
                                <div className="flex gap-2">
                                    {(Object.keys(PRIORITY_CONFIG) as AvisoPriority[]).map(p => {
                                        const pcfg = PRIORITY_CONFIG[p];
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setAvisoPriority(p)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${avisoPriority === p
                                                    ? `${pcfg.bg} ${pcfg.text} ${pcfg.border} shadow-sm`
                                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pcfg.icon}
                                                {pcfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Autor</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800"
                                    placeholder="Ex: Liderança"
                                    value={avisoAuthor}
                                    onChange={e => setAvisoAuthor(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={resetAvisoForm} className="flex-1 px-4 py-3.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                            <button onClick={handleSaveAviso} className="flex-1 px-4 py-3.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 shadow-lg shadow-accent-500/20 font-bold text-sm transition-colors">{editingAvisoId ? 'Salvar' : 'Publicar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};

// Componente de loading
const LoadingScreen: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-church-950 via-church-900 to-church-800">
        <div className="text-center">
            <Loader2 size={40} className="text-cyber-500 animate-spin mx-auto mb-4" />
            <p className="text-church-300 text-sm font-medium">Carregando...</p>
        </div>
    </div>
);

// Componente que protege rotas autenticadas
const ProtectedRoutes: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <div className="flex h-screen bg-[#F8F9FC] font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/kanban" element={<KanbanPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/members" element={<MembersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <AuthProvider>
                <ProtectedRoutes />
            </AuthProvider>
        </HashRouter>
    );
};

export default App;