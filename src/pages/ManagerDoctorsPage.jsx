import { useEffect, useMemo, useState } from 'react';
import { createDoctor, deleteDoctor, getDoctorsByHospital, updateDoctor } from '../api/doctors';
import { getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';

const blankForm = { user_id: '', type: '', available_days: '' };

export default function ManagerDoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDoctors = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;

      if (!hospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      const [doctorsResponse, usersInHospital] = await Promise.all([
        getDoctorsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getUsersByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
      ]);

      setDoctors(doctorsResponse.data.data || []);
      setUsers(usersInHospital.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [user]);

  const doctorUsers = useMemo(
    () => users.filter((item) => item.role === 'doctor'),
    [users]
  );

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      if (!term) return true;
      const userName = users.find((item) => item.id === doctor.user_id)?.name || '';
      return [userName, doctor.type, doctor.available_days?.join(', ')].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [doctors, users, search]);

  const validate = () => {
    const nextErrors = {};

    if (!form.user_id.trim()) nextErrors.user_id = 'User is required';
    if (!form.type.trim()) nextErrors.type = 'Doctor type is required';
    if (!form.available_days.trim()) nextErrors.available_days = 'Available days are required';

    return nextErrors;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (doctor) => {
    setEditing(doctor);
    setForm({
      user_id: doctor.user_id || '',
      type: doctor.type || '',
      available_days: Array.isArray(doctor.available_days) ? doctor.available_days.join(', ') : doctor.available_days || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(blankForm);
    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const hospitalId = users[0]?.hospital_id;
    if (!hospitalId) {
      setFormErrors({ submit: 'No hospital found for this manager' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        hospital_id: hospitalId,
        available_days: form.available_days.split(',').map((item) => item.trim()).filter(Boolean),
      };

      if (editing) {
        await updateDoctor(editing.id, payload);
      } else {
        await createDoctor(payload);
      }

      closeModal();
      await loadDoctors();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Unable to save doctor' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteDoctor(deleteTarget.id);
      setDeleteTarget(null);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete doctor');
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'doctorName', label: 'Doctor', render: (_, doctor) => users.find((item) => item.id === doctor.user_id)?.name || 'Unknown' },
    { key: 'type', label: 'Specialization' },
    { key: 'available_days', label: 'Available Days', render: (value) => Array.isArray(value) ? value.join(', ') : value || 'N/A' },
    { key: 'appointments', label: 'Appointments', render: () => '0' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, doctor) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(doctor)} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(doctor)} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading doctors..." />;
  if (error) return <ErrorState message={error} onRetry={loadDoctors} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Doctors</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add Doctor</button>
      </div>

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

      <Modal open={modalOpen} title={editing ? 'Edit doctor' : 'Add doctor'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Doctor user</label>
            <select
              value={form.user_id}
              onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select doctor</option>
              {doctorUsers.map((userItem) => (
                <option key={userItem.id} value={userItem.id}>{userItem.name}</option>
              ))}
            </select>
            {formErrors.user_id && <p className="mt-1 text-xs text-red-600">{formErrors.user_id}</p>}
            {!doctorUsers.length && (
              <p className="mt-1 text-xs text-amber-600">No doctor-role users found. Add a user first, then create the doctor record.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Doctor type</label>
            <input
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formErrors.type && <p className="mt-1 text-xs text-red-600">{formErrors.type}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Available days</label>
            <input
              value={form.available_days}
              onChange={(event) => setForm((prev) => ({ ...prev, available_days: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Monday, Tuesday"
            />
            {formErrors.available_days && <p className="mt-1 text-xs text-red-600">{formErrors.available_days}</p>}
          </div>

          {formErrors.submit && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formErrors.submit}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete doctor"
        message={`Are you sure you want to delete ${users.find((item) => item.id === deleteTarget?.user_id)?.name || 'this doctor'}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
