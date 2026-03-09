import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  timeSpentMinutes: number;
  comments: Comment[];
  order: number;
  creatorEmail?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  authorEmail: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

interface KanbanState {
  columns: Column[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  fetchData: () => Promise<void>;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  addColumn: (column: Column) => Promise<void>;
  reorderColumn: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  moveTask: (taskId: string, newStatus: string, newOrder: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  tasks: [],
  isLoading: false,
  error: null,
  userEmail: null,
  
  setUserEmail: (email) => set({ userEmail: email }),
  
  fetchData: async () => {
    set({ isLoading: true, error: null });
    
    const [colsRes, tasksRes] = await Promise.all([
      supabase.from('columns').select('*').order('order_index', { ascending: true }),
      supabase.from('tasks').select('*').order('order_index', { ascending: true })
    ]);
    
    if (colsRes.error) {
      console.error(colsRes.error);
      set({ error: colsRes.error.message, isLoading: false });
      return;
    }
    if (tasksRes.error) {
      console.error(tasksRes.error);
      set({ error: tasksRes.error.message, isLoading: false });
      return;
    }

    const mappedColumns: Column[] = colsRes.data.map((c: any) => ({
      id: c.id,
      title: c.title,
      order: c.order_index
    }));

    const mappedTasks: Task[] = tasksRes.data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      status: t.status,
      timeSpentMinutes: t.time_spent_minutes,
      comments: t.comments || [],
      order: t.order_index,
      creatorEmail: t.creator_email
    }));

    set({ columns: mappedColumns, tasks: mappedTasks, isLoading: false });
  },
  
  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),
  
  addTask: async (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }));
    
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      time_spent_minutes: task.timeSpentMinutes,
      comments: task.comments,
      order_index: task.order,
      creator_email: task.creatorEmail
    });
    
    if (error) console.error('Error adding task', error);
  },
  
  updateTask: async (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));
    
    const dbUpdates: Partial<Record<string, any>> = {};
    if ('title' in updates) dbUpdates.title = updates.title;
    if ('description' in updates) dbUpdates.description = updates.description;
    if ('status' in updates) dbUpdates.status = updates.status;
    if ('timeSpentMinutes' in updates) dbUpdates.time_spent_minutes = updates.timeSpentMinutes;
    if ('comments' in updates) dbUpdates.comments = updates.comments;
    if ('order' in updates) dbUpdates.order_index = updates.order;
    if ('creatorEmail' in updates) dbUpdates.creator_email = updates.creatorEmail;
    
    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
      if (error) console.error('Error updating task', error);
    }
  },

  addColumn: async (column) => {
    set((state) => ({ columns: [...state.columns, column] }));
    
    const { error } = await supabase.from('columns').insert({
      id: column.id,
      title: column.title,
      order_index: column.order
    });
    
    if (error) console.error('Error adding column', error);
  },
  
  reorderColumn: async (sourceIndex, destinationIndex) => {
    const { columns } = get();
    const newColumns = Array.from(columns).sort((a,b) => a.order - b.order);
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(destinationIndex, 0, removed);
    
    const updatedColumns = newColumns.map((c, i) => ({ ...c, order: i }));
    set({ columns: updatedColumns });
    
    const dbUpdates = updatedColumns.map(c => ({
      id: c.id,
      title: c.title,
      order_index: c.order
    }));
    
    const { error } = await supabase.from('columns').upsert(dbUpdates);
    if (error) console.error('Error reordering columns', error);
  },
  
  moveTask: async (taskId, newStatus, newOrder) => {
    set((state) => {
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return state;

      const updatedTasks = [...state.tasks];
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus, order: newOrder };
      return { tasks: updatedTasks };
    });
    
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      order_index: newOrder
    }).eq('id', taskId);
    
    if (error) console.error('Error moving task', error);
  },

  deleteTask: async (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
    
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task', error);
  },
}));
