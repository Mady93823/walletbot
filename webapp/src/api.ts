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
  const initData = WebApp.initData;

  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }

  return config;
});

export const walletApi = {
  getUserMe: () => api.post('/user/me'),
  createWallet: () => api.post('/wallet/create'),
  getHistory: () => api.post('/wallet/history'),
  estimateFee: () => api.post('/transaction/estimate'),
  sendTransaction: (to: string, amount: string, pin: string, memo?: string, feeLevel?: 'low' | 'medium' | 'high', assetId?: string, rpcUrl?: string, chainId?: number) =>
    api.post('/transaction/send', { to, amount, pin, memo, feeLevel, assetId, rpcUrl, chainId }),

  // Asset Management
  getAssets: () => api.get('/assets'),
  toggleAsset: (assetId: string, isEnabled: boolean) => api.post('/assets/toggle', { assetId, isEnabled }),
  addCustomAsset: (asset: any) => api.post('/assets/custom', asset),

  // Security
  setPin: (pin: string) => api.post('/security/set-pin', { pin }),
  verifyPin: (pin: string) => api.post('/security/verify-pin', { pin }),
};

export default api;
