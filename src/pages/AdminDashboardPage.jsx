import { useEffect, useState } from 'react';
import { getHospitals } from '../api/hospitals';
import { getUsers } from '../api/users';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const extractItems = (response) => response?.data?.data ?? [];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [hospitalsResponse, usersResponse] = await Promise.all([
          getHospitals(),
          getUsers(),
        ]);

        if (isMounted) {
          setHospitals(extractItems(hospitalsResponse));
          setUsers(extractItems(usersResponse));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Loading message="Loading platform overview..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const hospitalColumns = [
    { key: 'name', label: 'Hospital' },
    { key: 'location', label: 'Location' },
    { key: 'contacts', label: 'Contacts' },
  ];

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total hospitals" value={hospitals.length} tone="sky" />
        <StatCard title="Total users" value={users.length} tone="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Hospitals</h3>
          </div>

          {hospitals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No hospitals found.
            </p>
          ) : (
            <DataTable columns={hospitalColumns} rows={hospitals} emptyMessage="No hospitals found." />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Users</h3>
          </div>

          {users.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No users found.
            </p>
          ) : (
            <DataTable columns={userColumns} rows={users} emptyMessage="No users found." />
          )}
        </div>
      </div>
    </div>
  );
}
