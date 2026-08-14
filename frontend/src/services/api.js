import axios from 'axios';
import { firebaseDb } from './firebaseDb';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => {
    // Si la respuesta en lugar de JSON es HTML (ej. SPA rewrite de Firebase Hosting 200 index.html)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      const err = new Error('Respuesta no válida del servidor');
      err.isHtmlResponse = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Ejecuta la API remota y, si no hay backend Express activo, usa la Base de Datos Nube de Firebase sincronizada entre dispositivos
async function withFallback(remoteFn, fallbackFn) {
  try {
    const res = await remoteFn();
    return res;
  } catch (err) {
    if (
      err.isHtmlResponse ||
      !err.response ||
      err.response.status === 404 ||
      err.code === 'ERR_NETWORK'
    ) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const auth = {
  login: (data) => withFallback(() => API.post('/auth/login', data), () => firebaseDb.auth.login(data)),
  getUsers: () => withFallback(() => API.get('/auth/users'), () => firebaseDb.auth.getUsers()),
  createUser: (data) => withFallback(() => API.post('/auth/users', data), () => firebaseDb.auth.createUser(data)),
  updateUser: (id, data) => withFallback(() => API.put(`/auth/users/${id}`, data), () => firebaseDb.auth.updateUser(id, data)),
};

export const tickets = {
  getAll: (params) => withFallback(() => API.get('/tickets', { params }), () => firebaseDb.tickets.getAll(params)),
  getTotals: (params) => withFallback(() => API.get('/tickets/totals', { params }), () => firebaseDb.tickets.getTotals(params)),
  create: (data) => withFallback(() => API.post('/tickets', data), () => firebaseDb.tickets.create(data)),
  update: (id, data) => withFallback(() => API.put(`/tickets/${id}`, data), () => firebaseDb.tickets.update(id, data)),
  delete: (id) => withFallback(() => API.delete(`/tickets/${id}`), () => firebaseDb.tickets.delete(id)),
};

export const cuts = {
  getAll: (params) => withFallback(() => API.get('/cuts', { params }), () => firebaseDb.cuts.getAll(params)),
  getOne: (id) => withFallback(() => API.get(`/cuts/${id}`), () => firebaseDb.cuts.getOne(id)),
  preview: (data) => withFallback(() => API.post('/cuts/preview', data), () => firebaseDb.cuts.preview(data)),
  create: (data) => withFallback(() => API.post('/cuts', data), () => firebaseDb.cuts.create(data)),
};

export const secondaryCuts = {
  getAll: (params) => withFallback(() => API.get('/secondary-cuts', { params }), () => firebaseDb.secondaryCuts.getAll(params)),
  getOne: (id) => withFallback(() => API.get(`/secondary-cuts/${id}`), () => firebaseDb.secondaryCuts.getOne(id)),
  preview: (data) => withFallback(() => API.post('/secondary-cuts/preview', data), () => firebaseDb.secondaryCuts.preview(data)),
  create: (data) => withFallback(() => API.post('/secondary-cuts', data), () => firebaseDb.secondaryCuts.create(data)),
  getRecipients: () => withFallback(() => API.get('/secondary-cuts/destinatarios'), () => firebaseDb.secondaryCuts.getRecipients()),
  createRecipient: (data) => withFallback(() => API.post('/secondary-cuts/destinatarios', data), () => firebaseDb.secondaryCuts.createRecipient(data)),
  getAuditLogs: () => withFallback(() => API.get('/secondary-cuts/audit-logs'), () => firebaseDb.secondaryCuts.getAuditLogs()),
};

export const expenses = {
  getAll: (params) => withFallback(() => API.get('/expenses', { params }), () => firebaseDb.expenses.getAll(params)),
  create: (data) => withFallback(() => API.post('/expenses', data), () => firebaseDb.expenses.create(data)),
  delete: (id) => withFallback(() => API.delete(`/expenses/${id}`), () => firebaseDb.expenses.delete(id)),
};

export const incidents = {
  getAll: (params) => withFallback(() => API.get('/incidents', { params }), () => firebaseDb.incidents.getAll(params)),
  getOne: (id) => withFallback(() => API.get(`/incidents/${id}`), () => firebaseDb.incidents.getOne(id)),
  create: (data) => withFallback(() => API.post('/incidents', data), () => firebaseDb.incidents.create(data)),
  update: (id, data) => withFallback(() => API.put(`/incidents/${id}`, data), () => firebaseDb.incidents.update(id, data)),
};

export const improvements = {
  getAll: (params) => withFallback(() => API.get('/improvements', { params }), () => firebaseDb.improvements.getAll(params)),
  create: (data) => withFallback(() => API.post('/improvements', data), () => firebaseDb.improvements.create(data)),
  update: (id, data) => withFallback(() => API.put(`/improvements/${id}`, data), () => firebaseDb.improvements.update(id, data)),
};

export const assets = {
  getAll: (params) => withFallback(() => API.get('/assets', { params }), () => firebaseDb.assets.getAll(params)),
  create: (data) => withFallback(() => API.post('/assets', data), () => firebaseDb.assets.create(data)),
  update: (id, data) => withFallback(() => API.put(`/assets/${id}`, data), () => firebaseDb.assets.update(id, data)),
};

export const tasks = {
  getAll: (params) => withFallback(() => API.get('/tasks', { params }), () => firebaseDb.tasks.getAll(params)),
  create: (data) => withFallback(() => API.post('/tasks', data), () => firebaseDb.tasks.create(data)),
  update: (id, data) => withFallback(() => API.put(`/tasks/${id}`, data), () => firebaseDb.tasks.update(id, data)),
  toggle: (id) => withFallback(() => API.put(`/tasks/${id}/toggle`), () => firebaseDb.tasks.toggle(id)),
  delete: (id) => withFallback(() => API.delete(`/tasks/${id}`), () => firebaseDb.tasks.delete(id)),
};

export const reports = {
  ventas: (params) => withFallback(() => API.get('/reports/ventas', { params }), () => firebaseDb.reports.ventas(params)),
  cortes: (params) => withFallback(() => API.get('/reports/cortes', { params }), () => firebaseDb.reports.cortes(params)),
  gastos: (params) => withFallback(() => API.get('/reports/gastos', { params }), () => firebaseDb.reports.gastos(params)),
  incidencias: (params) => withFallback(() => API.get('/reports/incidencias', { params }), () => firebaseDb.reports.incidencias(params)),
};

export const dashboard = {
  get: () => withFallback(() => API.get('/dashboard'), () => firebaseDb.dashboard.get()),
};

export default API;