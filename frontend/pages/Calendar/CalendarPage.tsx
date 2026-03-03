import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, Task, Member, MOCK_MEMBERS } from '../../types';
import { ChevronLeft, ChevronRight, Plus, MessageCircle, Sparkles, X, Trash2, Edit, CheckSquare } from 'lucide-react';
import * as eventApi from '../../services/eventService';
import { listGoogleMonthEvents, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '../../services/googleCalendarService';
import { useAuth } from '../../contexts/AuthContext';

export const CalendarPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'SERVICE' | 'EVENT' | 'HOLIDAY'>('SERVICE');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('members');
      return saved ? JSON.parse(saved) as Member[] : MOCK_MEMBERS;
    } catch {
      return MOCK_MEMBERS;
    }
  });
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // AI Reminder State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Google Calendar events
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);

  // Mês/ano atuais derivados do estado
  const gcYear = currentDate.getFullYear();
  const gcMonth = currentDate.getMonth() + 1;

  // Carregar eventos da API ao montar e ao mudar de mês
  const loadEvents = useCallback(async () => {
    const apiEvents = await eventApi.fetchEvents();
    if (apiEvents.length > 0) {
      setEvents(apiEvents);
      localStorage.setItem('events', JSON.stringify(apiEvents));
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, gcYear, gcMonth]);

  // Mapa de assigneeIds para eventos do Google (salvo no localStorage)
  const getGoogleAssignees = (): Record<string, string[]> => {
    try {
      const saved = localStorage.getItem('googleEventAssignees');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  };

  const saveGoogleAssignees = (eventId: string, assigneeIds: string[]) => {
    const map = getGoogleAssignees();
    map[eventId] = assigneeIds;
    localStorage.setItem('googleEventAssignees', JSON.stringify(map));
  };

  // Carregar eventos do Google Calendar quando o mês mudar
  useEffect(() => {
    listGoogleMonthEvents(gcYear, gcMonth).then(data => {
      if (data.events && data.events.length > 0) {
        const assigneesMap = getGoogleAssignees();
        const mapped: CalendarEvent[] = data.events.map((e: any) => {
          const startStr = e.start || '';
          let dateStr = '';
          if (startStr.includes('T')) {
            dateStr = startStr.split('T')[0];
          } else {
            dateStr = startStr;
          }
          const isHoliday = e.description?.startsWith('[HOLIDAY]') || false;
          const googleId = `google-${e.id}`;
          return {
            id: googleId,
            date: dateStr,
            title: e.title || 'Sem título',
            type: isHoliday ? 'HOLIDAY' as const : 'EVENT' as const,
            assigneeIds: assigneesMap[googleId] || [],
            isGoogleEvent: true,
            isHoliday,
          };
        });
        setGoogleEvents(mapped);
      } else {
        setGoogleEvents([]);
      }
    }).catch(() => setGoogleEvents([]));
  }, [gcYear, gcMonth]);

  // Manter localStorage como cache
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  // Load tasks from localStorage to show on calendar
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Listen for task changes from Kanban page
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tasks') {
        try {
          setTasks(e.newValue ? JSON.parse(e.newValue) : []);
        } catch { }
      }
    };
    // Also poll for changes within same tab
    const interval = setInterval(() => {
      const saved = localStorage.getItem('tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTasks(prev => JSON.stringify(prev) !== saved ? parsed : prev);
        } catch { }
      }
    }, 1000);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Calculate needed empty slots to fill a 6-week grid (42 cells) for consistent sizing
  const usedSlots = firstDayOfMonth + daysInMonth;
  const totalSlots = 42;
  const emptyEndSlots = Math.max(0, totalSlots - usedSlots);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Função para recarregar eventos do Google Calendar do mês atual
  const reloadGoogleEvents = useCallback(async () => {
    try {
      const data = await listGoogleMonthEvents(gcYear, gcMonth);
      if (data.events && data.events.length > 0) {
        const assigneesMap = getGoogleAssignees();
        const mapped: CalendarEvent[] = data.events.map((e: any) => {
          const startStr = e.start || '';
          let dateStr = '';
          if (startStr.includes('T')) {
            dateStr = startStr.split('T')[0];
          } else {
            dateStr = startStr;
          }
          const isHoliday = e.description?.startsWith('[HOLIDAY]') || false;
          const googleId = `google-${e.id}`;
          return {
            id: googleId,
            date: dateStr,
            title: e.title || 'Sem título',
            type: isHoliday ? 'HOLIDAY' as const : 'EVENT' as const,
            assigneeIds: assigneesMap[googleId] || [],
            isGoogleEvent: true,
            isHoliday,
          };
        });
        setGoogleEvents(mapped);
      } else {
        setGoogleEvents([]);
      }
    } catch {
      setGoogleEvents([]);
    }
  }, [gcYear, gcMonth]);

  const handleAddEvent = async () => {
    if (!selectedDate || !newEventTitle) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

    if (editingEventId) {
      // Editando evento do Google Calendar
      if (editingEventId.startsWith('google-')) {
        const realGoogleId = editingEventId.replace('google-', '');
        await updateGoogleEvent(realGoogleId, {
          title: newEventTitle,
          date: dateStr,
        });
        // Salvar membros escalados localmente
        saveGoogleAssignees(editingEventId, selectedAssignees);
        await reloadGoogleEvents();
      } else {
        // Atualizar evento local via API
        const updated = await eventApi.updateEvent(editingEventId, {
          date: dateStr,
          title: newEventTitle,
          type: newEventType,
          assigneeIds: selectedAssignees,
        });
        if (updated) {
          setEvents(prev => prev.map(ev => ev.id === editingEventId ? updated : ev));
        } else {
          setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
            ...ev, date: dateStr, title: newEventTitle, type: newEventType, assigneeIds: selectedAssignees,
          } : ev));
        }
      }
    } else {
      // Criar evento: salva no Google Calendar
      const googleResult = await createGoogleEvent({
        title: newEventTitle,
        date: dateStr,
      });

      // Também salvar no banco local
      const created = await eventApi.createEvent({
        date: dateStr,
        title: newEventTitle,
        type: newEventType,
        assigneeIds: selectedAssignees,
      });
      if (created) {
        setEvents(prev => [...prev, created]);
      }

      // Recarregar eventos do Google para mostrar o novo
      await reloadGoogleEvents();
    }

    setShowModal(false);
    setEditingEventId(null);
    setNewEventTitle('');
    setSelectedAssignees([]);
    setAiSuggestion(null);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    const parts = event.date.split('-');
    const day = parts.length === 3 ? parseInt(parts[2], 10) : null;
    setSelectedDate(day);
    setNewEventTitle(event.title);
    setNewEventType((event as any).isGoogleEvent ? 'EVENT' : event.type);
    setSelectedAssignees(event.assigneeIds || []);
    setShowFullSchedule(false);
    setShowModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Excluir evento?')) return;

    if (id.startsWith('google-')) {
      // Excluir do Google Calendar
      const realGoogleId = id.replace('google-', '');
      const deleted = await deleteGoogleEvent(realGoogleId);
      if (deleted) {
        setGoogleEvents(prev => prev.filter(e => e.id !== id));
      } else {
        alert('Falha ao excluir evento do Google Calendar.');
      }
    } else {
      // Excluir evento local
      const deleted = await eventApi.deleteEvent(id);
      if (!deleted) {
        console.warn('Falha ao deletar no servidor, removendo localmente');
      }
      setEvents(prev => prev.filter(e => e.id !== id));
    }

    if (editingEventId === id) {
      setShowModal(false);
      setEditingEventId(null);
      setNewEventTitle('');
      setSelectedAssignees([]);
    }
  };

  // Combinar eventos locais + Google Calendar
  const allEvents = [...events, ...googleEvents];

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dateStr);
  };

  const getTasksForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate === dateStr);
  };

  const handleWhatsAppReminder = async (event: CalendarEvent) => {
    const memberNames = event.assigneeIds
      .map(id => members.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    let message = `*Lembrete Mídia - ${event.title}*\nData: ${event.date}\nEscala: ${memberNames || 'Toda a equipe'}\n\nDeus abençoe o serviço de vocês!`;

    if (aiSuggestion) {
      message = aiSuggestion;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'members') {
        try {
          setMembers(e.newValue ? JSON.parse(e.newValue) : []);
        } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    // dateStr expected as YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  };

  const renderAssigneesLabel = (assigneeIds: string[]) => {
    const names = assigneeIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean) as string[];
    if (names.length === 0) return 'Toda a equipe';
    if (names.length === 1) return names[0];
    return `• ${names.join(', ')}`;
  };

  // Filtrar eventos do mês atual e agrupar por data
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentMonthEvents = allEvents.filter(ev => ev.date.startsWith(currentMonthPrefix));

  const groupedEvents: [string, CalendarEvent[]][] = Object.entries(
    currentMonthEvents.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
      acc[ev.date] = acc[ev.date] || [];
      acc[ev.date].push(ev);
      return acc;
    }, {})
  );

  const currentMonthName = (() => {
    const s = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-church-900 tracking-tight">
            {(() => {
              const s = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              return s.charAt(0).toUpperCase() + s.slice(1);
            })()}
          </h2>
          <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
        </div>
        <div className="flex space-x-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft /></button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronRight /></button>
          <button onClick={() => setShowFullSchedule(true)} className="ml-2 px-3 py-1 bg-cyber-500 text-white rounded-md text-sm hover:bg-cyber-600">Ver escala completa</button>
        </div>
      </div>

      <div className="flex-1 relative -mx-8 px-8 -mt-8 pt-8 -mb-28 pb-28" style={{ overflow: 'clip' }}>
        <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] gap-px bg-gray-200 rounded-lg border border-gray-200 shadow-sm h-full relative">
          {/* Header Row */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center font-semibold text-gray-500 text-sm flex items-center justify-center">
              {day}
            </div>
          ))}

          {/* Leading Empty Slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-start-${i}`} className="bg-white h-full" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const dayTasks = getTasksForDay(day);
            const hasItems = dayEvents.length > 0 || dayTasks.length > 0;

            // Calculate which column (0-6) this day falls in
            const colIndex = (firstDayOfMonth + i) % 7;
            // Row index (0-based, starting after header)
            const rowIndex = Math.floor((firstDayOfMonth + i) / 7);
            const totalRows = Math.ceil((firstDayOfMonth + daysInMonth) / 7);

            // Determine transformOrigin based on position
            let originX = 'center';
            if (colIndex === 0) originX = 'left';
            else if (colIndex === 6) originX = 'right';
            else if (colIndex === 1) originX = '25%';
            else if (colIndex === 5) originX = '75%';

            let originY = 'center';
            if (rowIndex === 0) originY = 'top';
            else if (rowIndex >= totalRows - 1) originY = 'bottom';
            else if (rowIndex === 1) originY = '30%';
            else if (rowIndex >= totalRows - 2) originY = '70%';

            return (
              <div
                key={day}
                className={`bg-white p-2 h-full cursor-pointer border-gray-100 relative group flex flex-col transition-all duration-300 ease-out
                ${hoveredDay !== null && hoveredDay !== day
                    ? 'blur-[2px] opacity-60 scale-[0.98]'
                    : hoveredDay === null ? 'hover:bg-gray-50' : ''
                  }`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => { if (!isAdmin) return; setSelectedDate(day); setEditingEventId(null); setNewEventTitle(''); setNewEventType('SERVICE'); setSelectedAssignees([]); setAiSuggestion(null); setShowModal(true); }}
              >
                {/* Normal day content */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${new Date().getDate() === day && currentDate.getMonth() === new Date().getMonth() ? 'bg-church-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {isAdmin && hasItems && (
                    <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400">Add +</span>
                  )}
                </div>
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); if (isAdmin) openEditEvent(event); }}
                      className={`text-[10px] p-1 rounded border-l-2 cursor-pointer truncate transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                      ${(event as any).isGoogleEvent ? 'bg-accent-50 border-accent-500 text-accent-700' :
                          event.type === 'SERVICE' ? 'bg-church-50 border-church-500 text-church-700' :
                            event.type === 'HOLIDAY' ? 'bg-cyber-50 border-cyber-500 text-cyber-700' :
                              'bg-accent-50 border-accent-500 text-accent-700'}`}
                      title={isAdmin ? 'Editar evento' : event.title}
                      style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">
                          {(event as any).isGoogleEvent && <span className="text-[7px] bg-accent-200 text-accent-700 px-0.5 rounded mr-0.5">G</span>}
                          {event.title}
                        </span>
                        {isAdmin && <Edit size={10} className="ml-1 opacity-50 flex-shrink-0" />}
                      </div>
                    </div>
                  ))}
                  {dayTasks.map(task => (
                    <div
                      key={`task-${task.id}`}
                      className="text-[10px] p-1 rounded border-l-2 cursor-default truncate shadow-sm bg-purple-50 border-purple-500 text-purple-700"
                      title={task.description || task.title}
                    >
                      <div className="flex items-center gap-0.5">
                        <CheckSquare size={8} className="flex-shrink-0 opacity-60" />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expanded overlay on hover */}
                {hoveredDay === day && (
                  <div
                    className="absolute inset-0 z-30 bg-white rounded-xl shadow-2xl ring-2 ring-church-500/50 p-3 flex flex-col overflow-auto animate-fade-in"
                    style={{
                      transform: 'scale(1.4)',
                      transformOrigin: `${originX} ${originY}`,
                      minHeight: '200%',
                    }}
                    onClick={(e) => { e.stopPropagation(); if (!isAdmin) return; setSelectedDate(day); setEditingEventId(null); setNewEventTitle(''); setNewEventType('SERVICE'); setSelectedAssignees([]); setAiSuggestion(null); setShowModal(true); }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${new Date().getDate() === day && currentDate.getMonth() === new Date().getMonth() ? 'bg-church-600 text-white' : 'text-gray-800'}`}>
                        {day}
                      </span>
                      {isAdmin && <span className="text-[7px] text-church-600 font-medium">+ Evento</span>}
                    </div>
                    <div className="space-y-1 flex-1 overflow-y-auto">
                      {dayEvents.length === 0 && dayTasks.length === 0 && (
                        <p className="text-[7px] text-gray-400 italic">Sem eventos</p>
                      )}
                      {dayEvents.map(event => {
                        const assigneeNames = event.assigneeIds
                          .map(id => members.find(m => m.id === id)?.name)
                          .filter(Boolean);
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); if (isAdmin) openEditEvent(event); }}
                            className={`text-[7px] p-1 rounded border-l-2 cursor-pointer transition-all hover:brightness-95 active:scale-95 shadow-sm
                            ${(event as any).isGoogleEvent ? 'bg-accent-50 border-accent-500 text-accent-700' :
                                event.type === 'SERVICE' ? 'bg-church-50 border-church-500 text-church-700' :
                                  event.type === 'HOLIDAY' ? 'bg-cyber-50 border-cyber-500 text-cyber-700' :
                                    'bg-accent-50 border-accent-500 text-accent-700'}`}
                          >
                            <div className="font-semibold leading-tight">
                              {(event as any).isGoogleEvent && <span className="text-[5px] bg-accent-200 text-accent-700 px-0.5 rounded mr-0.5">G</span>}
                              {event.title}
                            </div>
                            <div className="text-[6px] opacity-70 mt-0.5 leading-tight">
                              {assigneeNames.length > 0
                                ? `📋 ${assigneeNames.join(', ')}`
                                : '👥 Toda a equipe'}
                            </div>
                          </div>
                        );
                      })}
                      {dayTasks.map(task => {
                        const assignee = members.find(m => m.id === task.assigneeId);
                        return (
                          <div
                            key={`task-${task.id}`}
                            className="text-[7px] p-1 rounded border-l-2 shadow-sm bg-purple-50 border-purple-500 text-purple-700"
                          >
                            <div className="font-semibold leading-tight flex items-center gap-0.5">
                              <CheckSquare size={7} className="flex-shrink-0 opacity-60" />
                              {task.title}
                            </div>
                            <div className="text-[6px] opacity-70 mt-0.5 leading-tight">
                              {assignee ? `📋 ${assignee.name}` : '👤 Sem responsável'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Trailing Empty Slots to complete grid */}
          {Array.from({ length: emptyEndSlots }).map((_, i) => (
            <div key={`empty-end-${i}`} className="bg-white h-full" />
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Novo Evento - Dia {selectedDate}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Culto da Família"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full border rounded-lg p-2 bg-white"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                >
                  <option value="SERVICE">Culto / Serviço</option>
                  <option value="EVENT">Evento Externo</option>
                  <option value="HOLIDAY">Feriado / Comemoração</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escala (Membros)</label>
                <div className="flex flex-wrap gap-2">
                  {members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedAssignees(prev =>
                          prev.includes(member.id)
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        );
                      }}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedAssignees.includes(member.id)
                        ? 'bg-cyber-500 text-white border-cyber-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => { setShowModal(false); setEditingEventId(null); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <div className="flex-1 flex justify-end items-center gap-2">
                  {editingEventId && (
                    <button onClick={() => editingEventId && handleDeleteEvent(editingEventId)} className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200">Excluir</button>
                  )}
                  <button
                    onClick={handleAddEvent}
                    className="px-4 py-2 bg-cyber-500 text-white rounded-lg hover:bg-cyber-600 font-medium"
                  >
                    {editingEventId ? 'Salvar alterações' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFullSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Escala Completa — {currentMonthName}</h3>
              <button onClick={() => setShowFullSchedule(false)} title="Fechar" className="text-gray-500 hover:text-gray-700 p-1 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {currentMonthEvents.length === 0 && (
                <div className="text-sm text-gray-500">Nenhum evento agendado para {currentMonthName.toLowerCase()}.</div>
              )}

              {groupedEvents.sort((a, b) => a[0].localeCompare(b[0])).map(([date, evs]) => (
                <div key={date} className="border-b pb-3">
                  <div className="font-semibold text-sm mb-2">{formatDateDisplay(date)}</div>
                  <div className="space-y-2">
                    {evs.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-gray-500">{renderAssigneesLabel(event.assigneeIds)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleWhatsAppReminder(event)} className="px-3 py-1 bg-cyber-500 hover:bg-cyber-600 text-white rounded text-sm">Lembrar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
