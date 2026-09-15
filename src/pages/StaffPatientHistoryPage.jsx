import { useEffect, useMemo, useState } from 'react';
import { createPatientHistory, getPatientHistoryByHospital, updatePatientHistory } from '../api/patientHistory';
import { getPatientsByHospital } from '../api/patients';
import { getStaffByUser } from '../api/staff';
import { getUserById } from '../api/users';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import Modal from '../components/Modal';

export default function StaffPatientHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError('');
      const userResponse = await getUserById(user.id);
      let staffResponse;
      try {
        staffResponse = await getStaffByUser(user.id);
      } catch (staffError) {
        if (staffError.response?.status === 404) {
          throw new Error('Your staff account is not linked to a staff record. Ask a manager to add your staff record.');
        }
        throw staffError;
      }
      const nextHospitalId = userResponse.data.data?.hospital_id;
      const staffRecord = staffResponse.data.data;
      if (!nextHospitalId || !staffRecord?.id) throw new Error('No staff record is linked to this account');
      const [historyResponse, patientsResponse] = await Promise.all([
        getPatientHistoryByHospital(nextHospitalId).catch(() => ({ data: { data: [] } })),
        getPatientsByHospital(nextHospitalId).catch(() => ({ data: { data: [] } })),
      ]);
      setHospitalId(nextHospitalId);
      setStaffId(staffRecord.id);
      setRecords(historyResponse.data.data || []);
      setPatients(patientsResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const rows = useMemo(() => records.map((record) => ({
    ...record,
    patientName: patients.find((patient) => patient.id === record.patient_id)?.name || 'Unknown patient',
  })), [records, patients]);

  const createVisit = async (event) => {
    event.preventDefault();
    if (!patientId || !date) return;
    try {
      setSubmitting(true);
      await createPatientHistory({ patient_id: patientId, hospital_id: hospitalId, served_by: staffId, date, status: 'open' });
      setModalOpen(false);
      setPatientId('');
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create outpatient visit');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (record) => {
    try {
      await updatePatientHistory(record.id, { status: record.status === 'open' ? 'closed' : 'open' });
      setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: item.status === 'open' ? 'closed' : 'open' } : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update history status');
    }
  };

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'status', label: 'Status', render: (_, record) => <button type="button" onClick={() => toggleStatus(record)} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${record.status === 'open' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{record.status}</button> },
  ];

  if (loading) return <Loading message="Loading patient history..." />;
  if (error) return <ErrorState message={error} onRetry={loadHistory} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Outpatient history</h2>
        <button type="button" onClick={() => setModalOpen(true)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">New visit</button>
      </div>
      {rows.length === 0 ? <EmptyState title="No history found." message="Create an outpatient visit to begin a patient record." /> : <DataTable columns={columns} rows={rows} />}
      <Modal open={modalOpen} title="New outpatient visit" onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createVisit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Patient</label>
            <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visit date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? 'Creating...' : 'Create visit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
