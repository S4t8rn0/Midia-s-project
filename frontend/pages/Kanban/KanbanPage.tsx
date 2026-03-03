import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, MOCK_MEMBERS, Member } from '../../types';
import { Plus, X, ArrowLeft, ArrowRight, Sparkles, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const COLUMNS = [
  { id: TaskStatus.IDEAS, title: 'Ideias' },
  { id: TaskStatus.IN_PROGRESS, title: 'Em Andamento' },
  { id: TaskStatus.REVIEW, title: 'Análise' },
  { id: TaskStatus.DONE, title: 'Concluído' },
];

export const KanbanPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Criar vinheta Natal', description: 'Video de 15s para stories', status: TaskStatus.IDEAS, assigneeId: '2' },
      { id: '2', title: 'Post culto domingo', description: 'Fotos da adoração', status: TaskStatus.DONE, assigneeId: '3' },
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('members');
      return saved ? JSON.parse(saved) as Member[] : MOCK_MEMBERS;
    } catch {
      return MOCK_MEMBERS;
    }
  });


  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

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

  const moveTask = (taskId: string, direction: 'next' | 'prev') => {
    const statusOrder = [TaskStatus.IDEAS, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];

    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      const currentIndex = statusOrder.indexOf(task.status);
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (newIndex < 0) newIndex = 0;
      if (newIndex >= statusOrder.length) newIndex = statusOrder.length - 1;

      return { ...task, status: statusOrder[newIndex] };
    }));
  };

  const addTask = () => {
    if (!newTaskTitle) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDesc,
      status: TaskStatus.IDEAS,
      assigneeId: newTaskAssignee,
      dueDate: newTaskDueDate || undefined,
    };
    setTasks([...tasks, task]);
    setShowModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: targetStatus } : task
      ));
    }
  };

  return (
    <div className="p-6 h-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-church-900 tracking-tight">Tarefas</h2>
          <span className="bg-cyber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">IPMC</span>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-cyber-500 hover:bg-cyber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Nova Tarefa
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-6 min-w-[1000px] h-[calc(100vh-140px)]">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className="flex-1 bg-gray-100 rounded-xl flex flex-col max-h-full transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center sticky top-0 bg-gray-100 rounded-t-xl z-10">
              {col.title}
              <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs text-gray-600">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar kanban-scroll">
              {tasks.filter(t => t.status === col.id).map(task => {
                const assignee = members.find(m => m.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 group hover:shadow-md transition-all cursor-move active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 leading-tight">{task.title}</h4>
                      {isAdmin && (
                        <button onClick={() => handleDelete(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
                        <CalendarDays size={12} className="text-church-500" />
                        <span>{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        {assignee ? (
                          <div title={assignee.name} className="w-6 h-6 rounded-full bg-church-600 text-white text-xs font-bold flex items-center justify-center">{assignee.name.charAt(0).toUpperCase()}</div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200"></div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => moveTask(task.id, 'prev')}
                          disabled={col.id === TaskStatus.IDEAS}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          onClick={() => moveTask(task.id, 'next')}
                          disabled={col.id === TaskStatus.DONE}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg m-2">
                  Solte aqui
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold mb-4">Nova Tarefa</h3>
            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Título"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Descrição"
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
            />
            <select
              className="w-full border p-2 rounded mb-2 bg-white"
              value={newTaskAssignee}
              onChange={e => setNewTaskAssignee(e.target.value)}
            >
              <option value="">Sem responsável</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
              <input
                type="date"
                className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-church-500 outline-none"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
              <button onClick={addTask} className="px-4 py-2 bg-cyber-500 text-white rounded">Criar</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
