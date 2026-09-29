import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
});

export const errMsg = (e) => e.response?.data?.error || e.message;