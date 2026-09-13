import api from './axios';

export const getHospitals = () => api.get('/hospital');
export const getHospitalById = (id) => api.get(`/hospital/${id}`);
export const createHospital = (payload) => api.post('/hospital', payload);
export const updateHospital = (id, payload) => api.put(`/hospital/${id}`, payload);
export const deleteHospital = (id) => api.delete(`/hospital/${id}`);
