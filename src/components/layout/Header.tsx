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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between shadow-sm shrink-0 gap-4">
      <Link to="/" className="flex items-center gap-2 shrink-0 group">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
          <span className="text-sm font-bold">✓</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          TODO Kanban
        </h1>
      </Link>

      {/* Board Selector */}
      {isDashboard && boards.length > 0 && (
        <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
          <label htmlFor="board-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
            Board
          </label>
          <select
            id="board-select"
            value={currentBoardId || ''}
            onChange={(e) => setCurrentBoardId(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none min-w-[120px] cursor-pointer"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id} className="bg-background">
                {board.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4 ml-auto">
        {/* Greeting */}
        {displayName && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground group">
              {getGreeting()}
            </span>
            <span className="text-sm font-semibold">{displayName}</span>
          </div>
        )}

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2">
          {/* Back to board button — only in admin area */}
          {isAdminArea && (
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/20 hover:bg-primary/5">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
          )}

          {/* Admin settings icon */}
          {isAdmin && (
            <Link to="/admin/users">
              <Button
                variant={isAdminArea ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-full"
                title="Área de Administração"
              >
                <Settings className={`h-5 w-5 ${isAdminArea ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`} />
              </Button>
            </Link>
          )}

          <ThemeToggle />

          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
