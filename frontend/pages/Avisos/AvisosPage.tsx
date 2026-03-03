import React, { useState, useEffect } from 'react';
import { Aviso, AvisoPriority, DEFAULT_AVISOS } from '../../types';
import { Plus, X, Trash2, Edit, AlertTriangle, Info, Lightbulb, Megaphone } from 'lucide-react';

const PRIORITY_CONFIG: Record<AvisoPriority, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
    urgent: {
        label: 'Importante',
        icon: <AlertTriangle size={14} />,
        bg: 'bg-accent-50',
        text: 'text-accent-600',
        border: 'border-accent-100',
        dot: 'bg-accent-500',
    },
    info: {
        label: 'Informativo',
        icon: <Info size={14} />,
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100',
        dot: 'bg-blue-500',
    },
    idea: {
        label: 'Ideia',
        icon: <Lightbulb size={14} />,
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-100',
        dot: 'bg-yellow-500',
    },
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export const AvisosPage: React.FC = () => {
    const [avisos, setAvisos] = useState<Aviso[]>(() => {
        try {
            const saved = localStorage.getItem('avisos');
            return saved ? JSON.parse(saved) : DEFAULT_AVISOS;
        } catch {
            return DEFAULT_AVISOS;
        }
    });

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<AvisoPriority>('info');
    const [author, setAuthor] = useState('');

    useEffect(() => {
        localStorage.setItem('avisos', JSON.stringify(avisos));
    }, [avisos]);

    const resetForm = () => {
        setShowModal(false);
        setEditingId(null);
        setTitle('');
        setMessage('');
        setPriority('info');
        setAuthor('');
    };

    const handleSave = () => {
        if (!title.trim() || !message.trim()) return;

        if (editingId) {
            setAvisos(prev => prev.map(a => a.id === editingId ? {
                ...a,
                title: title.trim(),
                message: message.trim(),
                priority,
                author: author.trim() || 'Anônimo',
            } : a));
        } else {
            const newAviso: Aviso = {
                id: Date.now().toString(),
                title: title.trim(),
                message: message.trim(),
                priority,
                author: author.trim() || 'Anônimo',
                createdAt: new Date().toISOString(),
            };
            setAvisos(prev => [newAviso, ...prev]);
        }
        resetForm();
    };

    const openEdit = (aviso: Aviso) => {
        setEditingId(aviso.id);
        setTitle(aviso.title);
        setMessage(aviso.message);
        setPriority(aviso.priority);
        setAuthor(aviso.author);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Excluir este aviso?')) return;
        setAvisos(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-4xl font-bold text-church-900 tracking-tight">Avisos</h1>
                        <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        Mural de comunicados da equipe
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-church-600 font-medium">{avisos.length} aviso{avisos.length !== 1 ? 's' : ''}</span>
                    </p>
                </div>

                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-accent-500 text-white px-4 py-2.5 rounded-xl hover:bg-accent-600 shadow-lg shadow-accent-500/20 flex items-center gap-2 transition-all active:scale-95 font-medium text-sm whitespace-nowrap"
                >
                    <Plus size={18} />
                    Novo Aviso
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto space-y-4 pb-4">
                {avisos.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Nenhum aviso ainda</p>
                        <p className="text-sm mt-1">Clique em "Novo Aviso" para criar o primeiro.</p>
                    </div>
                )}

                {avisos.map(aviso => {
                    const cfg = PRIORITY_CONFIG[aviso.priority];
                    return (
                        <div
                            key={aviso.id}
                            className={`flex items-start gap-4 p-5 rounded-2xl ${cfg.bg} border ${cfg.border} hover:shadow-md transition-all group relative`}
                        >
                            {/* Priority dot */}
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
                                <p className="text-gray-600 text-sm leading-relaxed">{aviso.message}</p>
                                <span className="text-xs text-gray-400 mt-2 block">
                                    {timeAgo(aviso.createdAt)} • Por {aviso.author}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                    onClick={() => openEdit(aviso)}
                                    className="p-2 text-gray-300 hover:text-church-700 hover:bg-church-50 rounded-full transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(aviso.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-church-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative">
                        <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>

                        <div className="mb-6">
                            <span className="text-cyber-500 text-xs font-bold uppercase tracking-widest">IPMC Mídia</span>
                            <h3 className="font-bold text-2xl text-gray-900 mt-1">{editingId ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Título</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                    placeholder="Ex: Reunião de pauta"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mensagem</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800 resize-none h-24"
                                    placeholder="Detalhes do aviso..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Prioridade</label>
                                <div className="flex gap-2">
                                    {(Object.keys(PRIORITY_CONFIG) as AvisoPriority[]).map(p => {
                                        const cfg = PRIORITY_CONFIG[p];
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPriority(p)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${priority === p
                                                    ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {cfg.icon}
                                                {cfg.label}
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
                                    value={author}
                                    onChange={e => setAuthor(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={resetForm} className="flex-1 px-4 py-3.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="flex-1 px-4 py-3.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 shadow-lg shadow-accent-500/20 font-bold text-sm transition-colors">{editingId ? 'Salvar' : 'Publicar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
