import { useEffect, useMemo, useState } from 'react';
import { createPatient, deletePatient, getPatientsByHospital, updatePatient } from '../api/patients';
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

const blankForm = { name: '', email: '', address: '' };

export default function ManagerPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadPatients = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;

      if (!hospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      const response = await getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } }));
      setPatients(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [user]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return patients.filter((patient) => {
      if (!term) return true;
      return [patient.name, patient.email, patient.address].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [patients, search]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';

    return nextErrors;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    setForm({
      name: patient.name || '',
      email: patient.email || '',
      address: patient.address || '',
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

    setSubmitting(true);

    try {
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;
      const payload = { ...form, hospital_id: hospitalId };

      if (editing) {
        await updatePatient(editing.id, payload);
      } else {
        await createPatient(payload);
      }

      closeModal();
      await loadPatients();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Unable to save patient' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deletePatient(deleteTarget.id);
      setDeleteTarget(null);
      await loadPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete patient');
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, patient) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(patient)} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(patient)} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading patients..." />;
  if (error) return <ErrorState message={error} onRetry={loadPatients} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add Patient</button>
      </div>

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

      <Modal open={modalOpen} title={editing ? 'Edit patient' : 'Add patient'} onClose={closeModal}>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
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
        title="Delete patient"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this patient'}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
