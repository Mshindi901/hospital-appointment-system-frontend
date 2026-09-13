import { useEffect, useState } from 'react';
import { getHospitals } from '../api/hospitals';
import { getUserById } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';

export default function ManagerHospitalPage() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHospital = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;

      if (!hospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      const response = await getHospitals();
      const nextHospital = (response.data.data || []).find((item) => item.id === hospitalId) || null;
      setHospital(nextHospital);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load hospital');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospital();
  }, [user]);

  if (loading) return <Loading message="Loading hospital details..." />;
  if (error) return <ErrorState message={error} onRetry={loadHospital} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800">Hospital</h2>

      {!hospital ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
          No hospital information found.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Name</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{hospital.name}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Location</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{hospital.location}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm text-slate-500">Contacts</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{hospital.contacts || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
