import { useAuth } from '../context/AuthContext';

export default function ManagerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800">Profile</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Role</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">{user?.role || 'Unknown'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">User ID</p>
          <p className="mt-1 text-lg font-semibold text-slate-800 break-all">{user?.id || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
