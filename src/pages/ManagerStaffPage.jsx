import { useEffect, useState } from 'react';
import { createUser, getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import Modal from '../components/Modal';

const blankForm = { name: '', email: '', password: '', role: 'doctor' };

export default function ManagerStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hospitalId, setHospitalId] = useState('');

  const loadStaff = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const nextHospitalId = userResponse.data.data?.hospital_id;

      if (!nextHospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      setHospitalId(nextHospitalId);

      const response = await getUsersByHospital(nextHospitalId);
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

  const openCreate = () => {
    setForm(blankForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(blankForm);
    setFormErrors({});
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    if (!form.role.trim()) nextErrors.role = 'Role is required';

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      await createUser({ ...form, hospital_id: hospitalId });
      closeModal();
      await loadStaff();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Unable to create staff member' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  if (loading) return <Loading message="Loading staff..." />;
  if (error) return <ErrorState message={error} onRetry={loadStaff} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Staff</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add Staff</button>
      </div>

      {staff.length === 0 ? (
        <EmptyState title="No staff found." message="This hospital does not have any staff records yet." />
      ) : (
        <DataTable columns={columns} rows={staff} />
      )}

      <Modal open={modalOpen} title="Add staff member" onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="doctor">Doctor</option>
              <option value="manager">Manager</option>
            </select>
            {formErrors.role && <p className="mt-1 text-xs text-red-600">{formErrors.role}</p>}
          </div>

          {formErrors.submit && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formErrors.submit}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
