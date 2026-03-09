import { supabase } from '@/lib/supabase';
import { useKanbanStore } from '@/store/kanbanStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function Header() {
  const {
    userEmail, userName, isAdmin,
    boards, currentBoardId, setCurrentBoardId, fetchBoards,
  } = useKanbanStore();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isAdminArea = location.pathname.startsWith('/admin');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const displayName = userName
    ? userName.split(' ')[0]
    : userEmail?.split('@')[0] ?? '';

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white dark:bg-gray-950 px-6 shadow-sm shrink-0 gap-4">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground p-1 rounded text-sm">✓</span>
          TODO Kanban
        </h1>
      </Link>

      {/* Board Selector — visible on dashboard for users with boards */}
      {isDashboard && boards.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="board-select" className="text-sm text-muted-foreground shrink-0 hidden sm:inline">
            Board:
          </label>
          <select
            id="board-select"
            value={currentBoardId || ''}
            onChange={(e) => setCurrentBoardId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[140px] max-w-[240px]"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4 ml-auto">
        {/* Greeting */}
        {displayName && (
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">
            {getGreeting()}, <span className="font-medium text-foreground">{displayName}</span> !
          </span>
        )}

        {/* Back to board button — only in admin area */}
        {isAdminArea && (
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Board
            </Button>
          </Link>
        )}

        {/* Admin settings icon */}
        {isAdmin && (
          <Link to="/admin/users">
            <Button
              variant={isAdminArea ? 'secondary' : 'ghost'}
              size="icon"
              title="Área de Administração"
            >
              <Settings className={`h-5 w-5 ${isAdminArea ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} />
            </Button>
          </Link>
        )}

        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
