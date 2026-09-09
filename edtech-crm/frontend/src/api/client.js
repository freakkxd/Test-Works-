import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const auth = {
  login: (email, password) => api.post('/login', { email, password }),
  logout: () => Promise.resolve(),
  me: () => api.get('/me'),
};

export const demo = {
  reseed: () => api.post('/demo/seed'),
};

export const dashboard = {
  get: () => api.get('/dashboard'),
};

export const students = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  exportCsv: () => api.get('/students/export', { responseType: 'blob' }),
  progress: (id) => api.get(`/students/${id}/progress`),
  toggleProgress: (studentId, lessonId) => api.post(`/students/${studentId}/progress/${lessonId}`),
  certificate: (id) => api.get(`/students/${id}/certificate`),
};

export const schedules = {
  list: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  markAttendance: (id, attendances) => api.post(`/schedules/${id}/attendance`, { attendances }),
};

export const payments = {
  list: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  exportCsv: (params) => api.get('/payments/export/csv', { params, responseType: 'blob' }),
};

export const courses = {
  list: () => api.get('/courses'),
};
