import { useEffect, useState } from 'react';
import { getUserById, getUsersByHospital } from '../api/users';
import { createStaffRecord, getStaffByHospital } from '../api/staff';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import Modal from '../components/Modal';

const blankForm = { user_id: '', department: '' };

export default function ManagerStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [staffRecords, setStaffRecords] = useState([]);
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

      const [usersResponse, recordsResponse] = await Promise.all([
        getUsersByHospital(nextHospitalId).catch(() => ({ data: { data: [] } })),
        getStaffByHospital(nextHospitalId).catch(() => ({ data: { data: [] } })),
      ]);
      setStaff((usersResponse.data.data || []).filter((item) => item.role === 'staff'));
      setStaffRecords(recordsResponse.data.data || []);
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

    if (!form.user_id.trim()) nextErrors.user_id = 'Staff user is required';
    if (!form.department.trim()) nextErrors.department = 'Department is required';

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      await createStaffRecord({ user_id: form.user_id, hospital_id: hospitalId, department: form.department });
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
    { key: 'department', label: 'Department', render: (_, item) => staffRecords.find((record) => record.user_id === item.id)?.department || 'N/A' },
  ];

  if (loading) return <Loading message="Loading staff..." />;
  if (error) return <ErrorState message={error} onRetry={loadStaff} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Staff records</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add staff record</button>
      </div>

      {staff.length === 0 ? (
        <EmptyState title="No staff found." message="This hospital does not have any staff records yet." />
      ) : (
        <DataTable columns={columns} rows={staff} />
      )}

      <Modal open={modalOpen} title="Add staff record" onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Staff user</label>
            <select
              value={form.user_id}
              onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select staff user</option>
              {staff.filter((item) => !staffRecords.some((record) => record.user_id === item.id)).map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
              ))}
            </select>
            {formErrors.user_id && <p className="mt-1 text-xs text-red-600">{formErrors.user_id}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <input value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Reception, nursing, records" />
            {formErrors.department && <p className="mt-1 text-xs text-red-600">{formErrors.department}</p>}
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
