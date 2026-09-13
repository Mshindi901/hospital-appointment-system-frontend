import api from './axios';

export const getUsers = () => api.get('/user');
export const getUserById = (id) => api.get(`/user/${id}`);
export const getUsersByHospital = (hospitalId) => api.get(`/user/hospital/${hospitalId}`);
export const updateUser = (id, payload) => api.put(`/user/${id}`, payload);
export const deleteUser = (id) => api.delete(`/user/${id}`);
