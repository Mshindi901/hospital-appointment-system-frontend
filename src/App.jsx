import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AdminLayout from './layouts/AdminLayout';
import ManagerLayout from './layouts/ManagerLayout';
import DoctorLayout from './layouts/DoctorLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminHospitalsPage from './pages/AdminHospitalsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProfilePage from './pages/AdminProfilePage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import ManagerDoctorsPage from './pages/ManagerDoctorsPage';
import ManagerPatientsPage from './pages/ManagerPatientsPage';
import ManagerAppointmentsPage from './pages/ManagerAppointmentsPage';
import ManagerStaffPage from './pages/ManagerStaffPage';
import ManagerHospitalPage from './pages/ManagerHospitalPage';
import ManagerProfilePage from './pages/ManagerProfilePage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
         <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['manager']} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager" element={<ManagerDashboardPage />} />
            <Route path="/manager/doctors" element={<ManagerDoctorsPage />} />
            <Route path="/manager/patients" element={<ManagerPatientsPage />} />
            <Route path="/manager/appointments" element={<ManagerAppointmentsPage />} />
            <Route path="/manager/staff" element={<ManagerStaffPage />} />
            <Route path="/manager/hospital" element={<ManagerHospitalPage />} />
            <Route path="/manager/profile" element={<ManagerProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['doctor']} />}>
          <Route element={<DoctorLayout />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/profile" element={<DoctorProfilePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>

    <Analytics/>
    </>
  );
}

export default App;
