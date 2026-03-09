import { NavLink, Outlet } from 'react-router-dom';
import { Users, LayoutDashboard } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-white dark:bg-gray-950 flex flex-col pt-6 gap-1 px-3">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Administração
        </p>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`
          }
        >
          <Users className="h-4 w-4 shrink-0" />
          Usuários
        </NavLink>
        <NavLink
          to="/admin/boards"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Boards
        </NavLink>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
