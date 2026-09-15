import { useEffect, useMemo, useState } from 'react';
import { getHospitals } from '../api/hospitals';
import { getPatientsByHospital } from '../api/patients';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const hospitalsResponse = await getHospitals();
      const hospitalList = hospitalsResponse.data.data || [];
      const patientResponses = await Promise.all(
        hospitalList.map((hospital) => getPatientsByHospital(hospital.id).catch(() => ({ data: { data: [] } })))
      );

      const patientList = patientResponses.flatMap((response) => response.data.data || []);
      const enriched = patientList.map((patient) => ({
        ...patient,
        hospitalName: hospitalList.find((hospital) => hospital.id === patient.hospital_id)?.name || 'Unknown hospital',
      }));

      setPatients(enriched);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return patients.filter((patient) => {
      if (!term) return true;
      return [patient.name, patient.email, patient.address, patient.hospitalName].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [patients, search]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'hospitalName', label: 'Hospital' },
    { key: 'gender', label: 'Gender', render: (value) => value ? value.toUpperCase() : 'N/A' },
    { key: 'blood_type', label: 'Blood type', render: (value) => value || 'N/A' },
    { key: 'allergies', label: 'Allergies', render: (value) => Array.isArray(value) && value.length ? value.join(', ') : 'None' },
  ];

  if (loading) return <Loading message="Loading patients..." />;
  if (error) return <ErrorState message={error} onRetry={loadPatients} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Patients</h2>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search patients..." />
        </div>
      </FilterBar>

      {filteredPatients.length === 0 ? (
        <EmptyState title="No patients found." message="No patients match the current search." />
      ) : (
        <DataTable columns={columns} rows={filteredPatients} />
      )}
    </div>
  );
}
