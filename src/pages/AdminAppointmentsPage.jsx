import { useEffect, useMemo, useState } from 'react';
import { getAppointmentsByHospital } from '../api/appointments';
import { getHospitals } from '../api/hospitals';
import { getDoctorsByHospital } from '../api/doctors';
import { getPatientsByHospital } from '../api/patients';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const hospitalsResponse = await getHospitals();
      const hospitalList = hospitalsResponse.data.data || [];

      const appointmentResponses = await Promise.all(
        hospitalList.map((hospital) => getAppointmentsByHospital(hospital.id).catch(() => ({ data: { data: [] } })))
      );

      const appointmentList = appointmentResponses.flatMap((response) => response.data.data || []);

      const doctorLists = await Promise.all(
        hospitalList.map((hospital) => getDoctorsByHospital(hospital.id).catch(() => ({ data: { data: [] } })))
      );
      const patientLists = await Promise.all(
        hospitalList.map((hospital) => getPatientsByHospital(hospital.id).catch(() => ({ data: { data: [] } })))
      );

      const doctors = doctorLists.flatMap((response) => response.data.data || []);
      const patients = patientLists.flatMap((response) => response.data.data || []);

      const enriched = appointmentList.map((appointment) => ({
        ...appointment,
        patientName: patients.find((patient) => patient.id === appointment.patient_id)?.name || 'Unknown patient',
        doctorName: doctors.find((doctor) => doctor.id === appointment.doctor_id)?.type || 'Unknown doctor',
        hospitalName: hospitalList.find((hospital) => hospital.id === appointment.hospital_id)?.name || 'Unknown hospital',
      }));

      setAppointments(enriched);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (!term) return true;
      return [appointment.patientName, appointment.doctorName, appointment.hospitalName, appointment.status].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [appointments, search]);

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'hospitalName', label: 'Hospital' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'start_time', label: 'Time' },
    { key: 'status', label: 'Status' },
  ];

  if (loading) return <Loading message="Loading appointments..." />;
  if (error) return <ErrorState message={error} onRetry={loadAppointments} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search appointments..." />
        </div>
      </FilterBar>

      {filteredAppointments.length === 0 ? (
        <EmptyState title="No appointments found." message="There are no appointments matching the current search." />
      ) : (
        <DataTable columns={columns} rows={filteredAppointments} />
      )}
    </div>
  );
}
