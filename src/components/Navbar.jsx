import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle, onMenuToggle }) {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 md:hidden"
            onClick={onMenuToggle}
          >
            <Menu size={18} />
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-slate-700">{user?.role || 'User'}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
