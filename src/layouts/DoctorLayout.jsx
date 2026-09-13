import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const doctorLinks = [
  { to: '/doctor', label: 'Dashboard' },
  { to: '/doctor/appointments', label: 'Appointments' },
  { to: '/doctor/profile', label: 'Profile' },
];

export default function DoctorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex flex-col md:flex-row">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar title="Doctor" items={doctorLinks} />
        </div>

        <div className="min-w-0 flex-1">
          <Navbar
            title="Doctor Dashboard"
            subtitle="Appointments overview"
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
