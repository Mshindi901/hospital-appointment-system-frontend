import { useEffect, useMemo, useState } from 'react';
import { getDoctorsByHospital } from '../api/doctors';
import { getHospitals } from '../api/hospitals';
import { getUsers } from '../api/users';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [hospitalsResponse, usersResponse] = await Promise.all([getHospitals(), getUsers()]);
      const hospitalList = hospitalsResponse.data.data || [];
      const userList = usersResponse.data.data || [];

      const doctorResponses = await Promise.all(
        hospitalList.map((hospital) => getDoctorsByHospital(hospital.id).catch(() => ({ data: { data: [] } })))
      );

      const doctorList = doctorResponses.flatMap((response) => response.data.data || []);

      const doctorRows = doctorList.map((doctor) => {
        const user = userList.find((item) => item.id === doctor.user_id);
        const hospital = hospitalList.find((item) => item.id === doctor.hospital_id);
        return {
          ...doctor,
          doctorName: user?.name || 'Unknown doctor',
          hospitalName: hospital?.name || 'Unknown hospital',
        };
      });

      setHospitals(hospitalList);
      setUsers(userList);
      setDoctors(doctorRows);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      if (!term) return true;
      return [doctor.doctorName, doctor.hospitalName, doctor.type, doctor.available_days?.join(', ')].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [doctors, search]);

  const columns = [
    { key: 'doctorName', label: 'Doctor' },
    { key: 'type', label: 'Specialization' },
    { key: 'available_days', label: 'Available Days', render: (value) => Array.isArray(value) ? value.join(', ') : value || 'N/A' },
    { key: 'hospitalName', label: 'Hospital' },
  ];

  if (loading) return <Loading message="Loading doctors..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Doctors</h2>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search doctors..." />
        </div>
      </FilterBar>

      {filteredDoctors.length === 0 ? (
        <EmptyState title="No doctors found." message="No doctors match the current search." />
      ) : (
        <DataTable columns={columns} rows={filteredDoctors} />
      )}
    </div>
  );
}
