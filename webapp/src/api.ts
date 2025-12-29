import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// Base URL for backend API
// Use relative path '/api' to leverage Vite proxy in dev and same-domain in prod
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add Telegram InitData to every request
api.interceptors.request.use((config) => {
  // If running inside Telegram, use real initData
  // If testing in browser, use a mock or empty string (backend might reject if validation enabled)
  const initData = WebApp.initData;
  
  if (initData) {
    config.data = {
      ...config.data,
      initData,
    };
  }
  
  return config;
});

export const walletApi = {
  getUserMe: () => api.post('/user/me'),
  createWallet: () => api.post('/wallet/create'),
  getHistory: () => api.post('/wallet/history'),
  estimateFee: () => api.post('/transaction/estimate'),
  sendTransaction: (to: string, amount: string, pin: string) => 
    api.post('/transaction/send', { to, amount, pin }),
};

export default api;
