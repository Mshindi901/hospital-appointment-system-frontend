import api from './axios';

export const getDoctorsByHospital = (hospitalId) => api.get(`/doctor/hospital/${hospitalId}`);
export const getDoctorById = (id) => api.get(`/doctor/${id}`);
export const getDoctorByUserId = (userId) => api.get(`/doctor/user/${userId}`);
export const createDoctor = (payload) => api.post('/doctor', payload);
export const updateDoctor = (id, payload) => api.put(`/doctor/${id}`, payload);
export const deleteDoctor = (id) => api.delete(`/doctor/${id}`);
