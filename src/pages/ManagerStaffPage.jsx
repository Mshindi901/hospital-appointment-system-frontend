import { useEffect, useState } from 'react';
import { getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';

export default function ManagerStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;

      if (!hospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      const response = await getUsersByHospital(hospitalId);
      setStaff((response.data.data || []).filter((item) => item.role !== 'admin'));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [user]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  if (loading) return <Loading message="Loading staff..." />;
  if (error) return <ErrorState message={error} onRetry={loadStaff} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Staff</h2>

      {staff.length === 0 ? (
        <EmptyState title="No staff found." message="This hospital does not have any staff records yet." />
      ) : (
        <DataTable columns={columns} rows={staff} />
      )}
    </div>
  );
}
