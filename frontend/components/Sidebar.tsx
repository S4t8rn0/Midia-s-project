import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Image as ImageIcon, Users, Trello, Home, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export const Sidebar: React.FC = () => {
  const { profile, isAdmin, logout } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center space-x-2.5 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive
      ? 'bg-gradient-to-r from-cyber-500 to-cyber-600 text-white shadow-glow-cyber translate-x-1'
      : 'text-church-200 hover:bg-white/5 hover:text-white hover:translate-x-1'
    }`;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-48 bg-church-800 min-h-screen flex flex-col flex-shrink-0 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-church-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyber-600 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-10 w-32 h-32 bg-cyber-500 rounded-full blur-3xl"></div>
      </div>

      <div className="p-5 z-10">
        <div className="mb-4 pb-2 border-b border-white/10">
          <div className="flex flex-col items-center">
            <img
              src={logo}
              alt="Mídia Comunicação"
              className="w-40 h-auto drop-shadow-lg"
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-church-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
          <nav className="space-y-3">
            <NavLink to="/" className={navClass}>
              {({ isActive }) => (
                <>
                  <Home size={18} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>
            <NavLink to="/calendar" className={navClass}>
              {({ isActive }) => (
                <>
                  <Calendar size={18} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                  <span>Calendário</span>
                </>
              )}
            </NavLink>
            <NavLink to="/kanban" className={navClass}>
              {({ isActive }) => (
                <>
                  <Trello size={18} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                  <span>Tarefas</span>
                </>
              )}
            </NavLink>
            <NavLink to="/gallery" className={navClass}>
              {({ isActive }) => (
                <>
                  <ImageIcon size={18} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                  <span>Galeria</span>
                </>
              )}
            </NavLink>
            <NavLink to="/members" className={navClass}>
              {({ isActive }) => (
                <>
                  <Users size={18} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                  <span>Membros</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="mt-auto p-4 z-10">
        <div className="bg-church-900/50 backdrop-blur-md rounded-2xl p-3 border border-white/5">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-full border-2 border-cyber-500 shadow-sm bg-church-700 flex items-center justify-center text-white font-bold text-sm">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{profile?.name || 'Usuário'}</p>
              <div className="flex items-center gap-1">
                {isAdmin && <Shield size={10} className="text-cyber-400" />}
                <p className="text-church-300 text-xs truncate">
                  {isAdmin ? 'Administrador' : 'Membro'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <NavLink to="/settings" className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-church-300 hover:text-white transition-colors flex items-center justify-center">
              <Settings size={16} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-church-300 hover:text-red-400 transition-colors flex items-center justify-center"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};