import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const managerLinks = [
  { to: '/manager', label: 'Dashboard' },
  { to: '/manager/doctors', label: 'Doctors' },
  { to: '/manager/patients', label: 'Patients' },
  { to: '/manager/appointments', label: 'Appointments' },
  { to: '/manager/staff', label: 'Staff' },
  { to: '/manager/patient-history', label: 'Patient history' },
  { to: '/manager/hospital', label: 'Hospital' },
  { to: '/manager/profile', label: 'Profile' },
];

export default function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex flex-col md:flex-row">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar title="Manager" items={managerLinks} />
        </div>

        <div className="min-w-0 flex-1">
          <Navbar
            title="Manager Dashboard"
            subtitle="Hospital operations"
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
