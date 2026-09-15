import { useEffect, useMemo, useState } from 'react';
import { getAppointmentsByDoctor } from '../api/appointments';
import { getDoctorByUserId } from '../api/doctors';
import { getPatientHistoryByHospital, updatePatientHistory } from '../api/patientHistory';
import { createPatientService } from '../api/patientServices';
import { getPatientsByHospital } from '../api/patients';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [histories, setHistories] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ history_id: '', service_provided: '', date: '' });
  const [serviceError, setServiceError] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError('');
        const doctorResponse = await getDoctorByUserId(user.id).catch(() => ({ data: { data: [] } }));
        const doctorList = doctorResponse.data.data || [];

        if (doctorList.length === 0) {
          setAppointments([]);
          setHistories([]);
          return;
        }

        const firstDoctor = doctorList[0];
        setDoctorId(firstDoctor.id);
        const [historyResponses, patientResponses] = await Promise.all([
          Promise.all([...new Set(doctorList.map((doctor) => doctor.hospital_id).filter(Boolean))].map((hospitalId) => getPatientHistoryByHospital(hospitalId).catch(() => ({ data: { data: [] } })))),
          Promise.all([...new Set(doctorList.map((doctor) => doctor.hospital_id).filter(Boolean))].map((hospitalId) => getPatientsByHospital(hospitalId).catch(() => ({ data: { data: [] } })))),
        ]);
        setHistories(historyResponses.flatMap((response) => response.data.data || []));
        setPatients(patientResponses.flatMap((response) => response.data.data || []));

        const appointmentResponses = await Promise.all(
          doctorList.map((doctor) => getAppointmentsByDoctor(doctor.id).catch(() => ({ data: { data: [] } })))
        );

        const appointmentList = appointmentResponses.flatMap((response) => response.data.data || []);
        setAppointments(appointmentList);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor appointments');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

  const openServiceModal = (historyId = '') => {
    setServiceForm({ history_id: historyId, service_provided: '', date: new Date().toISOString().slice(0, 10) });
    setServiceError('');
    setServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    setServiceForm({ history_id: '', service_provided: '', date: '' });
    setServiceError('');
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();
    if (!serviceForm.history_id || !serviceForm.service_provided || !serviceForm.date) {
      setServiceError('Patient history, service, and date are required');
      return;
    }
    try {
      setSubmittingService(true);
      await createPatientService({ ...serviceForm, doctor_id: doctorId });
      closeServiceModal();
    } catch (err) {
      setServiceError(err.response?.data?.message || 'Unable to add service');
    } finally {
      setSubmittingService(false);
    }
  };

  const toggleHistoryStatus = async (history) => {
    try {
      await updatePatientHistory(history.id, { status: history.status === 'open' ? 'closed' : 'open' });
      setHistories((current) => current.map((item) => item.id === history.id ? { ...item, status: item.status === 'open' ? 'closed' : 'open' } : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update history status');
    }
  };

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      todays: appointments.filter((item) => item.date?.slice(0, 10) === today).length,
      upcoming: appointments.filter((item) => new Date(item.date) > new Date(today)).length,
      inactive: appointments.filter((item) => item.status === 'inactive').length,
    };
  }, [appointments]);

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: 'start_time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            value === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const rows = appointments.map((appointment) => ({
    id: appointment.id,
    patientName: appointment.patientName || 'Unknown patient',
    date: appointment.date,
    start_time: appointment.start_time || 'N/A',
    status: appointment.status || 'active',
  }));

  if (loading) return <Loading message="Loading doctor dashboard..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Today's appointments" value={summary.todays} tone="sky" />
        <StatCard title="Upcoming appointments" value={summary.upcoming} tone="emerald" />
        <StatCard title="Inactive / completed" value={summary.inactive} tone="violet" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Appointments</h3>

        {rows.length === 0 ? (
          <EmptyState title="No appointments found." message="You do not have any scheduled appointments right now." />
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No appointments found." />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-800">Outpatient histories</h3>
          <button type="button" onClick={() => openServiceModal()} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Add service</button>
        </div>
        {histories.length === 0 ? (
          <EmptyState title="No patient histories found." message="Open outpatient histories will appear here." />
        ) : (
          <DataTable
            columns={[
              { key: 'patientName', label: 'Patient' },
              { key: 'date', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
              { key: 'status', label: 'Status', render: (_, history) => <button type="button" onClick={() => toggleHistoryStatus(history)} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${history.status === 'open' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{history.status}</button> },
              { key: 'actions', label: 'Actions', render: (_, history) => history.status === 'open' ? <button type="button" onClick={() => openServiceModal(history.id)} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Add service</button> : <span className="text-xs text-slate-400">Closed</span> },
            ]}
            rows={histories.map((history) => ({ ...history, patientName: patients.find((patient) => patient.id === history.patient_id)?.name || 'Unknown patient' }))}
          />
        )}
      </div>

      <Modal open={serviceModalOpen} title="Add service to patient history" onClose={closeServiceModal}>
        <form className="space-y-4" onSubmit={handleServiceSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Open patient history</label>
            <select value={serviceForm.history_id} onChange={(event) => setServiceForm((prev) => ({ ...prev, history_id: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select open history</option>
              {histories.filter((history) => history.status === 'open').map((history) => <option key={history.id} value={history.id}>{patients.find((patient) => patient.id === history.patient_id)?.name || 'Unknown patient'} - {new Date(history.date).toLocaleDateString()}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Service provided</label>
            <input value={serviceForm.service_provided} onChange={(event) => setServiceForm((prev) => ({ ...prev, service_provided: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Consultation, dressing, medication" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Service date</label>
            <input type="date" value={serviceForm.date} onChange={(event) => setServiceForm((prev) => ({ ...prev, date: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {serviceError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serviceError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeServiceModal} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submittingService} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{submittingService ? 'Saving...' : 'Add service'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
