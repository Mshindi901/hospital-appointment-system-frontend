import { useEffect, useMemo, useState } from 'react';
import { getDoctorsByHospital } from '../api/doctors';
import { getPatientHistoryByHospital, getServicesByHistory } from '../api/patientHistory';
import { getPatientsByHospital } from '../api/patients';
import { getStaffByHospital } from '../api/staff';
import { getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';

export default function ManagerPatientHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;
      if (!hospitalId) throw new Error('No hospital linked to this manager account');

      const [historyResponse, patientsResponse, staffResponse, usersResponse, doctorsResponse] = await Promise.all([
        getPatientHistoryByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getStaffByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getUsersByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getDoctorsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
      ]);

      const patients = patientsResponse.data.data || [];
      const users = usersResponse.data.data || [];
      const staff = staffResponse.data.data || [];
      const doctors = doctorsResponse.data.data || [];
      const history = historyResponse.data.data || [];
      const serviceResponses = await Promise.all(history.map((record) => getServicesByHistory(record.id).catch(() => ({ data: { data: null } }))));

      setRecords(history.map((record, index) => {
        const patient = patients.find((item) => item.id === record.patient_id);
        const servedByRecord = staff.find((item) => item.id === record.served_by);
        const servedBy = users.find((item) => item.id === servedByRecord?.user_id);
        const service = serviceResponses[index].data.data;
        const doctor = users.find((item) => item.id === doctors.find((item) => item.id === service?.doctor_id)?.user_id);

        return {
          ...record,
          patientName: patient?.name || 'Unknown patient',
          servedByName: servedBy?.name || 'Unknown staff',
          serviceName: service?.service_provided || 'No service recorded',
          doctorName: doctor?.name || 'N/A',
        };
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => !term || [record.patientName, record.servedByName, record.serviceName, record.doctorName, record.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [records, search]);

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'servedByName', label: 'Served by' },
    { key: 'serviceName', label: 'Service' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'status', label: 'Status', render: (value) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${value === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{value || 'Unknown'}</span> },
  ];

  if (loading) return <Loading message="Loading patient history..." />;
  if (error) return <ErrorState message={error} onRetry={loadHistory} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Patient history</h2>
      <FilterBar>
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search history..." /></div>
      </FilterBar>
      {filteredRecords.length === 0 ? <EmptyState title="No history found." message="No patient history records match the current search." /> : <DataTable columns={columns} rows={filteredRecords} />}
    </div>
  );
}
