import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Image, Users, Trello, Home, Settings, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
      isActive
        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-glow translate-x-1'
        : 'text-church-200 hover:bg-white/5 hover:text-white hover:translate-x-1'
    }`;

  return (
    <div className="w-72 bg-church-800 min-h-screen flex flex-col flex-shrink-0 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-church-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-600 rounded-full blur-3xl"></div>
      </div>

      <div className="p-8 z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
            <span className="text-church-800 font-bold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ecclesia</h1>
            <p className="text-accent-400 text-[10px] font-bold uppercase tracking-widest">Media Hub</p>
          </div>
        </div>

        <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-church-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
            <nav className="space-y-1.5">
                <NavLink to="/" className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Home size={20} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                      <span>Dashboard</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/calendar" className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Calendar size={20} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                      <span>Calendário</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/kanban" className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Trello size={20} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                      <span>Tarefas</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/gallery" className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Image size={20} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                      <span>Galeria</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/members" className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Users size={20} className={isActive ? 'text-white' : 'text-church-400 group-hover:text-white transition-colors'} />
                      <span>Membros</span>
                    </>
                  )}
                </NavLink>
            </nav>
        </div>
      </div>

      <div className="mt-auto p-6 z-10">
        <div className="bg-church-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src="https://picsum.photos/seed/admin/100"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-accent-500 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">Admin User</p>
              <p className="text-church-300 text-xs truncate">Líder de Mídia</p>
            </div>
          </div>
          <div className="flex gap-2">
              <button className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-church-300 hover:text-white transition-colors flex items-center justify-center">
                  <Settings size={16} />
              </button>
              <button className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-church-300 hover:text-red-400 transition-colors flex items-center justify-center">
                  <LogOut size={16} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};