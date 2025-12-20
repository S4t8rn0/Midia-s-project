export enum TaskStatus {
  IDEAS = 'IDEAS',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export interface Member {
  id: string;
  name: string;
  roles: string[];
  phone: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'SERVICE' | 'EVENT' | 'HOLIDAY';
  assigneeIds: string[];
  description?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  category: string;
  dateAdded: string;
}

export const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Ana Silva', roles: ['Designer', 'Fotógrafa'], phone: '5511999999999', avatar: 'https://picsum.photos/seed/ana/200' },
  { id: '2', name: 'Carlos Santos', roles: ['Video Editor'], phone: '5511988888888', avatar: 'https://picsum.photos/seed/carlos/200' },
  { id: '3', name: 'Beatriz Costa', roles: ['Social Media', 'Copywriter'], phone: '5511977777777', avatar: 'https://picsum.photos/seed/bia/200' },
];
