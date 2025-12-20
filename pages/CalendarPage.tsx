import React, { useState, useEffect } from 'react';
import { CalendarEvent, Member, MOCK_MEMBERS } from '../types';
import { ChevronLeft, ChevronRight, Plus, MessageCircle, Sparkles } from 'lucide-react';
import { generateContentSuggestion } from '../services/geminiService';

export const CalendarPage: React.FC = () => {
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
  
  // AI Reminder State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

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

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: dateStr,
      title: newEventTitle,
      type: newEventType,
      assigneeIds: selectedAssignees,
    };

    setEvents([...events, newEvent]);
    setShowModal(false);
    setNewEventTitle('');
    setSelectedAssignees([]);
    setAiSuggestion(null);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleWhatsAppReminder = async (event: CalendarEvent) => {
    const memberNames = event.assigneeIds
        .map(id => MOCK_MEMBERS.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    let message = `*Lembrete Mídia - ${event.title}*\nData: ${event.date}\nEscala: ${memberNames || 'Toda a equipe'}\n\nDeus abençoe o serviço de vocês!`;

    if (aiSuggestion) {
         message = aiSuggestion;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  const generateAiReminder = async () => {
      setIsGenerating(true);
      const prompt = `Create a short, encouraging WhatsApp reminder message for a church media team event titled "${newEventTitle || 'Culto'}" scheduled for the date ${currentDate.toDateString()}. Include emojis.`;
      const text = await generateContentSuggestion(prompt);
      setAiSuggestion(text);
      setIsGenerating(false);
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft /></button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronRight /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-1">
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
          
          return (
            <div 
              key={day} 
              className="bg-white p-2 h-full hover:bg-gray-50 cursor-pointer transition-colors border-gray-100 relative group flex flex-col overflow-hidden"
              onClick={() => { setSelectedDate(day); setShowModal(true); }}
            >
              <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${new Date().getDate() === day && currentDate.getMonth() === new Date().getMonth() ? 'bg-church-600 text-white' : 'text-gray-700'}`}>
                      {day}
                  </span>
                  {dayEvents.length > 0 && (
                      <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400">Add +</span>
                  )}
              </div>
              <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); handleWhatsAppReminder(event); }}
                    className={`text-[10px] p-1 rounded border-l-2 cursor-pointer truncate transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                      ${event.type === 'SERVICE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 
                        event.type === 'HOLIDAY' ? 'bg-red-50 border-red-500 text-red-700' : 
                        'bg-green-50 border-green-500 text-green-700'}`}
                    title="Click to send WhatsApp reminder"
                  >
                    <div className="flex items-center justify-between">
                        <span className="truncate">{event.title}</span>
                        <MessageCircle size={8} className="ml-1 opacity-50 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Trailing Empty Slots to complete grid */}
        {Array.from({ length: emptyEndSlots }).map((_, i) => (
            <div key={`empty-end-${i}`} className="bg-white h-full" />
        ))}
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
                  {MOCK_MEMBERS.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedAssignees(prev => 
                          prev.includes(member.id) 
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        );
                      }}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        selectedAssignees.includes(member.id)
                          ? 'bg-church-600 text-white border-church-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>

               {/* AI Assistant Section */}
               <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                           <Sparkles size={12} /> Gemini Assistant
                       </span>
                       <button 
                         onClick={generateAiReminder}
                         disabled={isGenerating || !newEventTitle}
                         className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                           {isGenerating ? 'Gerando...' : 'Gerar Lembrete'}
                       </button>
                  </div>
                  {aiSuggestion && (
                      <textarea 
                        className="w-full text-xs p-2 rounded border border-purple-200 bg-white text-gray-600 h-20 resize-none"
                        value={aiSuggestion}
                        onChange={(e) => setAiSuggestion(e.target.value)}
                      />
                  )}
               </div>

              <div className="flex space-x-2 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddEvent}
                  className="flex-1 px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
