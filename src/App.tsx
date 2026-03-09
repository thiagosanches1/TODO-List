import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { AdminUserManagement } from '@/pages/AdminUserManagement';
import { AdminBoardManagement } from '@/pages/AdminBoardManagement';
import { AdminBoardConfig } from '@/pages/AdminBoardConfig';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useKanbanStore } from '@/store/kanbanStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

const ProtectedRoute = ({
  children,
  session,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  session: Session | null;
  requireAdmin?: boolean;
}) => {
  const { isAdmin } = useKanbanStore();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUserEmail } = useKanbanStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserEmail(session?.user?.email || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, [setUserEmail]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="todo-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!session ? <Register /> : <Navigate to="/" replace />} />

          {/* Protected routes wrapped in MainLayout */}
          <Route
            element={
              <ProtectedRoute session={session}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Admin sub-routes wrapped in AdminLayout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute session={session} requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="boards" element={<AdminBoardManagement />} />
              <Route path="boards/:boardId" element={<AdminBoardConfig />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
