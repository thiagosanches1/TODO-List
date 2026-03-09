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
  boardId: string;
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
  boardId: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
}

interface KanbanState {
  columns: Column[];
  tasks: Task[];
  boards: Board[];
  currentBoardId: string | null;
  isLoading: boolean;
  error: string | null;
  userEmail: string | null;
  userName: string | null;
  isAdmin: boolean;
  isEditMode: boolean;

  setUserEmail: (email: string | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setCurrentBoardId: (boardId: string | null) => void;
  fetchBoards: () => Promise<void>;
  fetchData: () => Promise<void>;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  addColumn: (column: Column) => Promise<void>;
  reorderColumn: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  moveTask: (taskId: string, newStatus: string, newOrder: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  renameColumn: (columnId: string, newTitle: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  tasks: [],
  boards: [],
  currentBoardId: null,
  isLoading: false,
  error: null,
  userEmail: null,
  userName: null,
  isAdmin: false,
  isEditMode: false,

  setUserEmail: (email) => set({ userEmail: email }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsEditMode: (isEditMode) => set({ isEditMode }),

  setCurrentBoardId: (boardId) => {
    set({ currentBoardId: boardId, columns: [], tasks: [] });
    if (boardId) {
      // fetch board data after setting the id
      setTimeout(() => get().fetchData(), 0);
    }
  },

  fetchBoards: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [boardsRes, profileRes] = await Promise.all([
      supabase.from('boards').select('*').order('created_at', { ascending: true }),
      supabase.from('profiles').select('is_admin, full_name').eq('id', user.id).single(),
    ]);

    const isAdmin = profileRes.data?.is_admin || false;
    const userName = profileRes.data?.full_name || null;
    set({ isAdmin, userName });

    if (boardsRes.error) {
      console.error('Error fetching boards:', boardsRes.error);
      return;
    }

    const boards: Board[] = (boardsRes.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
    }));

    set({ boards });

    // Auto-select first board if none selected
    const currentBoardId = get().currentBoardId;
    if (!currentBoardId && boards.length > 0) {
      set({ currentBoardId: boards[0].id });
    } else if (boards.length === 0) {
      set({ currentBoardId: null, columns: [], tasks: [] });
    }
  },

  fetchData: async () => {
    const { currentBoardId } = get();
    if (!currentBoardId) {
      set({ columns: [], tasks: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    const [colsRes, tasksRes] = await Promise.all([
      supabase.from('columns').select('*').eq('board_id', currentBoardId).order('order_index', { ascending: true }),
      supabase.from('tasks').select('*').eq('board_id', currentBoardId).order('order_index', { ascending: true }),
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
      order: c.order_index,
      boardId: c.board_id,
    }));

    const mappedTasks: Task[] = tasksRes.data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      status: t.status,
      timeSpentMinutes: t.time_spent_minutes,
      comments: t.comments || [],
      order: t.order_index,
      creatorEmail: t.creator_email,
      boardId: t.board_id,
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
      creator_email: task.creatorEmail,
      board_id: task.boardId,
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
      order_index: column.order,
      board_id: column.boardId,
    });

    if (error) console.error('Error adding column', error);
  },

  reorderColumn: async (sourceIndex, destinationIndex) => {
    const { columns } = get();
    const newColumns = Array.from(columns).sort((a, b) => a.order - b.order);
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(destinationIndex, 0, removed);

    const updatedColumns = newColumns.map((c, i) => ({ ...c, order: i }));
    set({ columns: updatedColumns });

    const dbUpdates = updatedColumns.map(c => ({
      id: c.id,
      title: c.title,
      order_index: c.order,
      board_id: c.boardId,
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
      order_index: newOrder,
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

  renameColumn: async (columnId, newTitle) => {
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, title: newTitle } : c
      ),
    }));
    const { error } = await supabase
      .from('columns')
      .update({ title: newTitle })
      .eq('id', columnId);
    if (error) console.error('Error renaming column', error);
  },
}));
