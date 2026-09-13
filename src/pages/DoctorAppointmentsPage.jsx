import { useEffect, useMemo, useState } from 'react';
import { getAppointmentsByDoctor } from '../api/appointments';
import { getDoctorByUserId } from '../api/doctors';
import { getPatientsByHospital } from '../api/patients';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const hospitalIds = [...new Set(doctorList.map((doctor) => doctor.hospital_id).filter(Boolean))];
      const patientResponses = await Promise.all(
        hospitalIds.map((hospitalId) => getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })))
      );
      const patients = patientResponses.flatMap((response) => response.data.data || []);
      const patientLookup = Object.fromEntries(patients.map((patient) => [patient.id, patient.name]));

      const appointmentResponses = await Promise.all(
        doctorList.map((doctor) => getAppointmentsByDoctor(doctor.id).catch(() => ({ data: { data: [] } })))
      );

      const appointmentList = appointmentResponses.flatMap((response) => response.data.data || []);
      setAppointments(
        appointmentList.map((appointment) => ({
          ...appointment,
          patientName: patientLookup[appointment.patient_id] || 'Unknown patient',
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesDate = !dateFilter || appointment.date?.slice(0, 10) === dateFilter;
      const matchesSearch =
        !term ||
        [appointment.patient_id, appointment.start_time, appointment.status].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A') },
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

  const rows = filteredAppointments.map((appointment) => ({
    id: appointment.id,
    patientName: appointment.patientName || 'Unknown patient',
    date: appointment.date,
    start_time: appointment.start_time || 'N/A',
    status: appointment.status || 'active',
  }));

  if (loading) return <Loading message="Loading appointments..." />;
  if (error) return <ErrorState message={error} onRetry={loadAppointments} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search patient..." />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No appointments found." message="No appointments match the current filters." />
      ) : (
        <DataTable columns={columns} rows={rows} emptyMessage="No appointments found." />
      )}
    </div>
  );
}
