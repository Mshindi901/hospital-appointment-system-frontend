import api from './axios';

export const getPatientsByHospital = (hospitalId) => api.get(`/patient/hospitals/${hospitalId}`);
export const getPatientById = (id) => api.get(`/patient/${id}`);
export const createPatient = (payload) => api.post('/patient', payload);
export const updatePatient = (id, payload) => api.put(`/patient/${id}`, payload);
export const deletePatient = (id) => api.delete(`/patient/${id}`);
