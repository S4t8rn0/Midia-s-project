import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CalendarPage } from './pages/CalendarPage';
import { KanbanPage } from './pages/KanbanPage';
import { GalleryPage } from './pages/GalleryPage';
import { MembersPage } from './pages/MembersPage';
import { Bell, Search, Calendar as CalendarIcon, CheckCircle2, Image as ImageIcon, ArrowUpRight, Users } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, delay }: any) => (
    <div className={`bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in`} style={{ animationDelay: delay }}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
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

const DashboardHome = () => (
    <div className="p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bom dia, Time! 👋</h1>
                <p className="text-gray-500 mt-1">Aqui está o resumo das atividades da mídia para hoje.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-soft focus:ring-2 focus:ring-accent-500 w-64 text-sm"
                    />
                </div>
                <button className="p-2.5 bg-white rounded-xl shadow-soft text-gray-500 hover:text-accent-500 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>

        {/* Hero Card */}
        <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl relative bg-church-800 text-white">
            <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-church-600 to-transparent opacity-50"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-500 rounded-full blur-[100px] opacity-40"></div>
            
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium mb-4">
                        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
                        Próximo Evento
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">Culto da Família</h2>
                    <p className="text-church-100 text-lg mb-6 max-w-md">Domingo, 19:00h • Auditório Principal</p>
                    <div className="flex gap-3">
                         <button className="px-6 py-3 bg-white text-church-900 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 transition-colors">
                             Ver Escala
                         </button>
                         <button className="px-6 py-3 bg-church-700/50 text-white border border-white/10 rounded-xl font-medium text-sm hover:bg-church-700 transition-colors">
                             Materiais
                         </button>
                    </div>
                </div>
                
                {/* Visual Decoration or Quick Date */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full md:w-auto text-center min-w-[140px]">
                    <span className="block text-accent-400 font-bold uppercase text-sm tracking-wider mb-1">Outubro</span>
                    <span className="block text-5xl font-bold">24</span>
                    <span className="block text-church-200 text-sm mt-1">Domingo</span>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
             <StatCard 
                title="Tarefas Pendentes" 
                value="12" 
                subtitle="3 Alta Prioridade" 
                icon={CheckCircle2} 
                colorClass="bg-accent-500" 
                delay="0ms"
             />
             <StatCard 
                title="Escala da Semana" 
                value="8" 
                subtitle="Membros escalados" 
                icon={Users} // We'll need to import Users if not available globally, sticking to passed props
                colorClass="bg-church-500" 
                delay="100ms"
             />
             <StatCard 
                title="Galeria" 
                value="1.2k" 
                subtitle="+45 essa semana" 
                icon={ImageIcon} 
                colorClass="bg-blue-500" 
                delay="200ms"
             />
             <StatCard 
                title="Eventos do Mês" 
                value="04" 
                subtitle="2 Especiais" 
                icon={CalendarIcon} 
                colorClass="bg-green-500" 
                delay="300ms"
             />
        </div>
        
        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Avisos Recentes</h3>
                    <button className="text-church-600 text-sm font-medium hover:text-church-800">Ver todos</button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group">
                        <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                            ⚠️
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Backup dos Arquivos</h4>
                            <p className="text-gray-500 text-sm mt-1">Lembrem-se de subir os vídeos do último culto para o Drive até sexta-feira.</p>
                            <span className="text-xs text-gray-400 mt-2 block">Há 2 horas • Por Admin</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group">
                        <div className="w-10 h-10 rounded-full bg-church-100 flex items-center justify-center text-church-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                            💡
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Brainstorming Natal</h4>
                            <p className="text-gray-500 text-sm mt-1">Reunião confirmada para próxima terça, 20h. Tragam referências visuais.</p>
                            <span className="text-xs text-gray-400 mt-2 block">Ontem • Por Liderança</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
                <h3 className="font-bold text-xl text-gray-900 mb-6">Escala Hoje</h3>
                <div className="space-y-6">
                    {/* Mock List */}
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <img src={`https://picsum.photos/seed/${i+50}/100`} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">Membro {i+1}</h5>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-church-50 text-church-600 text-[10px] font-bold uppercase tracking-wide border border-church-100">
                                    {i === 0 ? 'Video' : i === 1 ? 'Som' : 'Foto'}
                                </span>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:border-church-500 hover:text-church-600 transition-colors mt-4">
                        Ver escala completa
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-[#F8F9FC] font-sans overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;