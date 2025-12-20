import React, { useState } from 'react';
import { Member, MOCK_MEMBERS } from '../types';
import { Phone, Trash2, Plus, X, Search, Filter, Camera, Video, Mic, Monitor, User } from 'lucide-react';

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [showModal, setShowModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRoles, setNewMemberRoles] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['Todos', 'Video', 'Foto', 'Som', 'Design', 'Social Media'];

  const addMember = () => {
      if(!newMemberName) return;
      
      const rolesArray = newMemberRoles
          .split(',')
          .map(r => r.trim())
          .filter(r => r.length > 0);

      const newMember: Member = {
          id: Date.now().toString(),
          name: newMemberName,
          roles: rolesArray.length > 0 ? rolesArray : ['Voluntário'],
          phone: '',
          avatar: `https://picsum.photos/seed/${Date.now()}/200`
      };
      setMembers([...members, newMember]);
      setShowModal(false);
      setNewMemberName('');
      setNewMemberRoles('');
  };

  const removeMember = (id: string) => {
      if(confirm("Remover membro da equipe?")) {
          setMembers(members.filter(m => m.id !== id));
      }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' || member.roles.some(role => role.toLowerCase().includes(activeFilter.toLowerCase()));
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (role: string) => {
      const r = role.toLowerCase();
      if (r.includes('video') || r.includes('editor')) return <Video size={12} />;
      if (r.includes('foto')) return <Camera size={12} />;
      if (r.includes('som') || r.includes('audio')) return <Mic size={12} />;
      if (r.includes('design') || r.includes('social')) return <Monitor size={12} />;
      return <User size={12} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-bold text-church-900 tracking-tight">Mídia</h1>
                <span className="bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
                Gerenciamento de voluntários e escalas
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-church-600 font-medium">{members.length} membros ativos</span>
            </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar voluntário..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-500 text-sm shadow-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
            onClick={() => setShowModal(true)}
            className="bg-church-800 text-white px-4 py-2.5 rounded-xl hover:bg-church-900 shadow-lg shadow-church-900/20 flex items-center gap-2 transition-all active:scale-95 font-medium text-sm whitespace-nowrap"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Voluntário</span>
            </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border ${
                    activeFilter === filter
                    ? 'bg-church-100 text-church-800 border-church-200 shadow-sm'
                    : 'bg-white text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                  {filter}
              </button>
          ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col items-center text-center">
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remover"
                 >
                     <Trash2 size={16} />
                 </button>
            </div>

            <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-accent-500 to-church-600">
                    <img 
                        src={member.avatar} 
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover border-4 border-white bg-gray-100"
                    />
                </div>
                <div className="absolute bottom-0 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" title="Ativo"></div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-1">{member.name}</h3>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {member.roles.map((role, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wide border border-gray-100">
                        {getRoleIcon(role)}
                        {role}
                    </span>
                ))}
            </div>

            <button 
                onClick={() => window.open(`https://wa.me/${member.phone}`, '_blank')}
                className="w-full mt-auto py-2.5 rounded-xl bg-church-50 text-church-700 font-medium text-sm hover:bg-church-100 transition-colors flex items-center justify-center gap-2 border border-church-100"
            >
                <Phone size={16} className="text-church-600"/>
                Contatar
            </button>
          </div>
        ))}

        {/* Add Card (Empty State esque) */}
        <button 
            onClick={() => setShowModal(true)}
            className="rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-accent-500 hover:border-accent-300 hover:bg-accent-50/50 transition-all group min-h-[280px]"
        >
            <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                <Plus size={32} />
            </div>
            <span className="font-medium text-sm">Adicionar Membro</span>
        </button>
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-church-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in relative">
                  <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                      <X size={24} />
                  </button>
                  
                  <div className="mb-6">
                      <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">IPMC Mídia</span>
                      <h3 className="font-bold text-2xl text-gray-900 mt-1">Novo Voluntário</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nome Completo</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                            placeholder="Ex: João da Silva"
                            value={newMemberName}
                            onChange={e => setNewMemberName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Áreas de Atuação</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-gray-800"
                            placeholder="Ex: Video, Foto, Editor"
                            value={newMemberRoles}
                            onChange={e => setNewMemberRoles(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Filter size={10} />
                            Separe as funções por vírgula
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                      <button onClick={addMember} className="flex-1 px-4 py-3.5 bg-church-800 text-white rounded-xl hover:bg-church-900 shadow-lg shadow-church-900/20 font-bold text-sm transition-colors">Salvar Cadastro</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};