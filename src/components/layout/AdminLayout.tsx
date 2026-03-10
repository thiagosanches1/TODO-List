import { NavLink, Outlet } from 'react-router-dom';
import { Users, LayoutDashboard } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/30 backdrop-blur-md flex flex-col pt-8 pb-8 gap-1 px-4 transition-all duration-300 h-full">
        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4 opacity-70">
          Administração
        </p>
        <div className="space-y-1">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Users className="h-5 w-5 shrink-0" />
            Usuários
          </NavLink>
          <NavLink
            to="/admin/boards"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Boards
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative">
        <Outlet />
      </div>
    </div>
  );
}
