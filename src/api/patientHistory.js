import api from './axios';

export const getPatientHistoryByHospital = (hospitalId) => api.get(`/patient-history/hospital/${hospitalId}`);
export const getPatientHistoryByPatient = (patientId) => api.get(`/patient-history/patient/${patientId}`);
export const getServicesByHistory = (historyId) => api.get(`/services/patient-history/${historyId}`);
export const createPatientHistory = (payload) => api.post('/patient-history', payload);
export const updatePatientHistory = (id, payload) => api.put(`/patient-history/${id}`, payload);
