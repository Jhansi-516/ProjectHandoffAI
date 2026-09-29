import axios from 'axios';
export const api = axios.create({ baseURL: '/api' });
export const errMsg = (e) => e.response?.data?.error || e.message;
