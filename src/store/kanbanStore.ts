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
  assignedTo?: string;
  storyPoints?: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string | null;
  email: string | null;
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
  isAdmin: boolean | null;
  boardMembers: Profile[];

  setUserEmail: (email: string | null) => void;
  setIsAdmin: (isAdmin: boolean | null) => void;
  setCurrentBoardId: (boardId: string | null) => void;
  fetchBoards: () => Promise<void>;
  fetchData: () => Promise<void>;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, newStatus: string, newOrder: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
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
  isAdmin: null,
  boardMembers: [],

  setUserEmail: (email) => set({ userEmail: email }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  setCurrentBoardId: (boardId) => {
    set({ currentBoardId: boardId, columns: [], tasks: [] });
    if (boardId) {
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

    const [colsRes, tasksRes, membersDataRes] = await Promise.all([
      supabase.from('columns').select('*').eq('board_id', currentBoardId).order('order_index', { ascending: true }),
      supabase.from('tasks').select('*').eq('board_id', currentBoardId).order('order_index', { ascending: true }),
      supabase.from('board_members').select('user_id').eq('board_id', currentBoardId),
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

    let mappedMembers: Profile[] = [];
    if (membersDataRes.data && membersDataRes.data.length > 0) {
      const memberIds = membersDataRes.data.map((m: any) => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds);

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
      } else {
        mappedMembers = (profilesData || []).map((p: any) => ({
          id: p.id,
          fullName: p.full_name,
          email: p.email,
        }));
      }
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
      boardId: t.board_id,
      creatorEmail: t.creator_email,
      assignedTo: t.assigned_to,
      storyPoints: t.story_points,
      createdAt: t.created_at,
    }));

    set({ columns: mappedColumns, tasks: mappedTasks, boardMembers: mappedMembers, isLoading: false });
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
      created_at: task.createdAt,
      board_id: task.boardId,
      assigned_to: task.assignedTo,
      story_points: task.storyPoints,
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
    if ('assignedTo' in updates) dbUpdates.assigned_to = updates.assignedTo;
    if ('storyPoints' in updates) dbUpdates.story_points = updates.storyPoints;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
      if (error) console.error('Error updating task', error);
    }
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
}));
