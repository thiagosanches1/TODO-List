import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_25%)] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
        <Outlet />
      </main>
    </div>
  );
}
