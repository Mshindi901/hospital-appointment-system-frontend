import { useEffect, useMemo, useState } from 'react';
import { createAppointment, deleteAppointment, getAppointmentsByHospital, updateAppointment } from '../api/appointments';
import { getDoctorsByHospital } from '../api/doctors';
import { getPatientsByHospital } from '../api/patients';
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

const blankForm = { patient_id: '', doctor_id: '', date: '', start_time: '' };

export default function ManagerAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;

      if (!hospitalId) {
        throw new Error('No hospital linked to this manager account');
      }

      const [appointmentsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        getAppointmentsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getDoctorsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
      ]);

      setAppointments(appointmentsResponse.data.data || []);
      setPatients(patientsResponse.data.data || []);
      setDoctors(doctorsResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patientName = patients.find((patient) => patient.id === appointment.patient_id)?.name || 'Unknown';
      const doctorName = doctors.find((doctor) => doctor.id === appointment.doctor_id)?.type || 'Unknown';
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesDate = dateFilter === 'all' || appointment.date?.slice(0, 10) === dateFilter;
      const matchesSearch =
        !term ||
        [patientName, doctorName, appointment.date, appointment.start_time].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [appointments, patients, doctors, search, statusFilter, dateFilter]);

  const validate = () => {
    const nextErrors = {};

    if (!form.patient_id.trim()) nextErrors.patient_id = 'Patient is required';
    if (!form.doctor_id.trim()) nextErrors.doctor_id = 'Doctor is required';
    if (!form.date.trim()) nextErrors.date = 'Date is required';
    if (!form.start_time.trim()) nextErrors.start_time = 'Start time is required';

    return nextErrors;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (appointment) => {
    setEditing(appointment);
    setForm({
      patient_id: appointment.patient_id || '',
      doctor_id: appointment.doctor_id || '',
      date: appointment.date ? new Date(appointment.date).toISOString().slice(0, 10) : '',
      start_time: appointment.start_time || '',
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

    const userResponse = await getUserById(user.id);
    const hospitalId = userResponse.data.data?.hospital_id;

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        hospital_id: hospitalId,
      };

      if (editing) {
        await updateAppointment(editing.id, payload);
      } else {
        await createAppointment(payload);
      }

      closeModal();
      await loadAppointments();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Unable to save appointment' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAppointment(deleteTarget.id);
      setDeleteTarget(null);
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete appointment');
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'patient_name',
      label: 'Patient',
      render: (_, appointment) => patients.find((patient) => patient.id === appointment.patient_id)?.name || 'Unknown',
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: (_, appointment) => doctors.find((doctor) => doctor.id === appointment.doctor_id)?.type || 'Unknown',
    },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'start_time', label: 'Time' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, appointment) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(appointment)} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(appointment)} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading appointments..." />;
  if (error) return <ErrorState message={error} onRetry={loadAppointments} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add Appointment</button>
      </div>

      <FilterBar>
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search appointments..." />
        </div>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </FilterBar>

      {filteredAppointments.length === 0 ? (
        <EmptyState title="No appointments found." message="No appointments match the current filters." />
      ) : (
        <DataTable columns={columns} rows={filteredAppointments.map((appointment) => ({ ...appointment, patient_name: patients.find((patient) => patient.id === appointment.patient_id)?.name || 'Unknown' }))} />
      )}

      <Modal open={modalOpen} title={editing ? 'Edit appointment' : 'Add appointment'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Patient</label>
            <select
              value={form.patient_id}
              onChange={(event) => setForm((prev) => ({ ...prev, patient_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
            {formErrors.patient_id && <p className="mt-1 text-xs text-red-600">{formErrors.patient_id}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
            <select
              value={form.doctor_id}
              onChange={(event) => setForm((prev) => ({ ...prev, doctor_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctors.find((d) => d.id === doctor.id)?.type || 'Doctor'}</option>
              ))}
            </select>
            {formErrors.doctor_id && <p className="mt-1 text-xs text-red-600">{formErrors.doctor_id}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {formErrors.date && <p className="mt-1 text-xs text-red-600">{formErrors.date}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {formErrors.start_time && <p className="mt-1 text-xs text-red-600">{formErrors.start_time}</p>}
            </div>
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
        title="Delete appointment"
        message={`Are you sure you want to delete this appointment?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
