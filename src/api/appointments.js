import api from './axios';

export const getAppointmentById = (id) => api.get(`/appointment/${id}`);
export const getAppointmentsByHospital = (hospitalId) => api.get(`/appointment/hospital/${hospitalId}`);
export const getAppointmentsByPatient = (patientId) => api.get(`/appointment/patient/${patientId}`);
export const getAppointmentsByDoctor = (doctorId) => api.get(`/appointment/doctor/${doctorId}`);
export const createAppointment = (payload) => api.post('/appointment', payload);
export const updateAppointment = (id, payload) => api.put(`/appointment/${id}`, payload);
export const deleteAppointment = (id) => api.delete(`/appointment/${id}`);
