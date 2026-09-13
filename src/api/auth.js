import api from './axios';

export const signin = (payload) => api.post('/auth/signin', payload);
