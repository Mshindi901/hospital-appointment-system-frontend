import { useEffect, useMemo, useState } from 'react';
import { createHospital, deleteHospital, getHospitals, updateHospital } from '../api/hospitals';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import ConfirmDialog from '../components/ConfirmDialog';

const blankForm = { name: '', contacts: '', location: '' };

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getHospitals();
      setHospitals(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      if (!term) return true;
      return [hospital.name, hospital.location, hospital.contacts].some((value) =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [hospitals, search]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.location.trim()) nextErrors.location = 'Location is required';

    return nextErrors;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (hospital) => {
    setEditing(hospital);
    setForm({
      name: hospital.name || '',
      contacts: hospital.contacts || '',
      location: hospital.location || '',
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
      if (editing) {
        await updateHospital(editing.id, form);
      } else {
        await createHospital(form);
      }

      closeModal();
      await loadHospitals();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Unable to save hospital' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteHospital(deleteTarget.id);
      setDeleteTarget(null);
      await loadHospitals();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete hospital');
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'contacts', label: 'Contacts' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, hospital) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(hospital)} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(hospital)} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading hospitals..." />;
  if (error) return <ErrorState message={error} onRetry={loadHospitals} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Hospitals</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add Hospital</button>
      </div>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search hospitals..." />
        </div>
      </FilterBar>

      {filteredHospitals.length === 0 ? (
        <EmptyState title="No hospitals found." message="There are no hospitals matching your current search." />
      ) : (
        <DataTable columns={columns} rows={filteredHospitals.map((hospital) => ({ ...hospital, actions: '' }))} />
      )}

      <Modal open={modalOpen} title={editing ? 'Edit hospital' : 'Add hospital'} onClose={closeModal}>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {formErrors.location && <p className="mt-1 text-xs text-red-600">{formErrors.location}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contacts</label>
            <input
              value={form.contacts}
              onChange={(event) => setForm((prev) => ({ ...prev, contacts: event.target.value }))}
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
        title="Delete hospital"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this hospital'}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
