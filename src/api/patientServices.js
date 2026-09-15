import api from './axios';

export const createPatientService = (payload) => api.post('/services', payload);
export const getServicesByDoctor = (doctorId) => api.get(`/services/doctor/${doctorId}`);
