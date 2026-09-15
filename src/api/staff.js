import api from './axios';

export const getStaffByHospital = (hospitalId) => api.get(`/staff/hospital/${hospitalId}`);
export const getStaffByUser = (userId) => api.get(`/staff/user/${userId}`);
export const createStaffRecord = (payload) => api.post('/staff', payload);
export const updateStaffRecord = (id, payload) => api.put(`/staff/${id}`, payload);
export const deleteStaffRecord = (id) => api.delete(`/staff/${id}`);
