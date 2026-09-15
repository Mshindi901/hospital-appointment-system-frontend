import { useEffect, useMemo, useState } from 'react';
import { getDoctorsByHospital } from '../api/doctors';
import { createPatientHistory, getPatientHistoryByHospital, getServicesByHistory } from '../api/patientHistory';
import { getPatientsByHospital } from '../api/patients';
import { getStaffByHospital } from '../api/staff';
import { getUserById, getUsersByHospital } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';
import SearchInput from '../components/SearchInput';
import Modal from '../components/Modal';

const blankForm = { patient_id: '', served_by: '', date: '', status: 'open' };

export default function ManagerPatientHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      const hospitalId = userResponse.data.data?.hospital_id;
      if (!hospitalId) throw new Error('No hospital linked to this manager account');

      const [historyResponse, patientsResponse, staffResponse, usersResponse, doctorsResponse] = await Promise.all([
        getPatientHistoryByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getStaffByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getUsersByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
        getDoctorsByHospital(hospitalId).catch(() => ({ data: { data: [] } })),
      ]);

      const patients = patientsResponse.data.data || [];
      const users = usersResponse.data.data || [];
      const staff = staffResponse.data.data || [];
      const doctors = doctorsResponse.data.data || [];
      const history = historyResponse.data.data || [];
      setHospitalId(hospitalId);
      setPatients(patients);
      setStaff(staff);
      const serviceResponses = await Promise.all(history.map((record) => getServicesByHistory(record.id).catch(() => ({ data: { data: null } }))));

      setRecords(history.map((record, index) => {
        const patient = patients.find((item) => item.id === record.patient_id);
        const servedByRecord = staff.find((item) => item.id === record.served_by);
        const servedBy = users.find((item) => item.id === servedByRecord?.user_id);
        const service = serviceResponses[index].data.data;
        const doctor = users.find((item) => item.id === doctors.find((item) => item.id === service?.doctor_id)?.user_id);

        return {
          ...record,
          patientName: patient?.name || 'Unknown patient',
          servedByName: servedBy?.name || 'Unknown staff',
          serviceName: service?.service_provided || 'No service recorded',
          doctorName: doctor?.name || 'N/A',
        };
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => !term || [record.patientName, record.servedByName, record.serviceName, record.doctorName, record.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [records, search]);

  const openCreate = () => {
    setForm({ ...blankForm, date: new Date().toISOString().slice(0, 10) });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(blankForm);
    setFormError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.patient_id || !form.served_by || !form.date) {
      setFormError('Patient, staff member, and date are required');
      return;
    }

    try {
      setSubmitting(true);
      await createPatientHistory({ ...form, hospital_id: hospitalId });
      closeModal();
      await loadHistory();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create patient history');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'servedByName', label: 'Served by' },
    { key: 'serviceName', label: 'Service' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'status', label: 'Status', render: (value) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${value === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{value || 'Unknown'}</span> },
  ];

  if (loading) return <Loading message="Loading patient history..." />;
  if (error) return <ErrorState message={error} onRetry={loadHistory} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Patient history</h2>
        <button type="button" onClick={openCreate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">New outpatient visit</button>
      </div>
      <FilterBar>
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search history..." /></div>
      </FilterBar>
      {filteredRecords.length === 0 ? <EmptyState title="No history found." message="No patient history records match the current search." /> : <DataTable columns={columns} rows={filteredRecords} />}

      <Modal open={modalOpen} title="New outpatient visit" onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Patient</label>
            <select value={form.patient_id} onChange={(event) => setForm((prev) => ({ ...prev, patient_id: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Served by staff</label>
            <select value={form.served_by} onChange={(event) => setForm((prev) => ({ ...prev, served_by: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select staff member</option>
              {staff.map((record) => <option key={record.id} value={record.id}>{record.department || 'Staff'} ({record.user_id})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visit date</label>
            <input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? 'Creating...' : 'Create visit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
