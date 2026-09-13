import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/hospitals', label: 'Hospitals' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/profile', label: 'Profile' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex flex-col md:flex-row">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar title={user?.name || 'Admin'} items={adminLinks} />
        </div>

        <div className="min-w-0 flex-1">
          <Navbar
            title="Admin Dashboard"
            subtitle="Platform overview"
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          />
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
