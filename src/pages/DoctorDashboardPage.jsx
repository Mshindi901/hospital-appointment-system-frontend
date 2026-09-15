import { useEffect, useMemo, useState } from 'react';
import { getAppointmentsByDoctor } from '../api/appointments';
import { getDoctorByUserId } from '../api/doctors';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError('');
        const doctorResponse = await getDoctorByUserId(user.id).catch(() => ({ data: { data: [] } }));
        const doctorList = doctorResponse.data.data || [];

        if (doctorList.length === 0) {
          setAppointments([]);
          return;
        }

        const appointmentResponses = await Promise.all(
          doctorList.map((doctor) => getAppointmentsByDoctor(doctor.id).catch(() => ({ data: { data: [] } })))
        );

        const appointmentList = appointmentResponses.flatMap((response) => response.data.data || []);
        setAppointments(appointmentList);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor appointments');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      todays: appointments.filter((item) => item.date?.slice(0, 10) === today).length,
      upcoming: appointments.filter((item) => new Date(item.date) > new Date(today)).length,
      inactive: appointments.filter((item) => item.status === 'inactive').length,
    };
  }, [appointments]);

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'start_time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            value === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const rows = appointments.map((appointment) => ({
    id: appointment.id,
    patientName: appointment.patientName || 'Unknown patient',
    date: appointment.date,
    start_time: appointment.start_time || 'N/A',
    status: appointment.status || 'active',
  }));

  if (loading) return <Loading message="Loading doctor dashboard..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Today's appointments" value={summary.todays} tone="sky" />
        <StatCard title="Upcoming appointments" value={summary.upcoming} tone="emerald" />
        <StatCard title="Inactive / completed" value={summary.inactive} tone="violet" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Appointments</h3>

        {rows.length === 0 ? (
          <EmptyState title="No appointments found." message="You do not have any scheduled appointments right now." />
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No appointments found." />
        )}
      </div>
    </div>
  );
}
