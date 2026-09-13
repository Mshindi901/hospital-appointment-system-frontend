import { useEffect, useMemo, useState } from 'react';
import { getAppointmentsByHospital } from '../api/appointments';
import { getDoctorsByHospital } from '../api/doctors';
import { getHospitals } from '../api/hospitals';
import { getPatientsByHospital } from '../api/patients';
import { getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError('');

        const userResponse = await getUserById(user.id);
        const userRecord = userResponse.data.data;
        const hospitalId = userRecord?.hospital_id;

        if (!hospitalId) {
          throw new Error('No hospital linked to this manager account');
        }

        const [hospitalResponse, doctorsResponse, patientsResponse, appointmentsResponse, staffResponse] = await Promise.all([
          getHospitals(),
          getDoctorsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
          getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
          getAppointmentsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
          getUsersByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        ]);

        const hospitalList = hospitalResponse.data.data || [];
        const nextHospital = hospitalList.find((item) => item.id === hospitalId) || null;

        setHospital(nextHospital);
        setDoctors(doctorsResponse.data.data || []);
        setPatients(patientsResponse.data.data || []);
        setAppointments(appointmentsResponse.data.data || []);
        setStaff(staffResponse.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load manager dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const overview = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = appointments.filter((appointment) => appointment.date && new Date(appointment.date) >= new Date(today));

    return {
      todayCount: appointments.filter((appointment) => appointment.date && appointment.date.slice(0, 10) === today).length,
      upcomingCount: upcoming.length,
      activeCount: appointments.filter((appointment) => appointment.status === 'active').length,
    };
  }, [appointments]);

  const rows = useMemo(
    () =>
      [...appointments]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 6)
        .map((appointment) => ({
          id: appointment.id,
          patient: appointment.patient_id || 'Unknown patient',
          doctor: appointment.doctor_id || 'Unknown doctor',
          date: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          time: appointment.start_time || 'N/A',
          status: appointment.status || 'active',
        })),
    [appointments]
  );

  const columns = [
    { key: 'patient', label: 'Patient' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'status', label: 'Status' },
  ];

  if (loading) return <Loading message="Loading manager dashboard..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">{hospital?.name || 'Hospital overview'}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Location</p>
            <p className="mt-1 text-sm text-slate-700">{hospital?.location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Contacts</p>
            <p className="mt-1 text-sm text-slate-700">{hospital?.contacts || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Staff count</p>
            <p className="mt-1 text-sm text-slate-700">{staff.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total doctors" value={doctors.length} tone="sky" />
        <StatCard title="Total patients" value={patients.length} tone="emerald" />
        <StatCard title="Today's appointments" value={overview.todayCount} tone="violet" />
        <StatCard title="Upcoming appointments" value={overview.upcomingCount} tone="amber" />
        <StatCard title="Active appointments" value={overview.activeCount} tone="rose" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Upcoming appointments</h3>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No appointments found." message="There are no upcoming appointments for this hospital." />
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No appointments found." />
        )}
      </div>
    </div>
  );
}
