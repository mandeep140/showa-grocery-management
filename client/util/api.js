'use client';

import axios from 'axios';
import connectionManager from './ConnectionManager';

const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    if (!config.url?.includes('/api/health')) {
      const serverURL = connectionManager.getServerURL();
      if (serverURL) {
        config.baseURL = serverURL;
      } else {
        return Promise.reject({
          success: false,
          message: 'Not connected to server',
          error: 'NETWORK_ERROR'
        });
      }
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Access denied — insufficient permissions';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('permission-denied', { detail: { message } }));
      }
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      connectionManager.notifyNetworkError();

      return Promise.reject({
        success: false,
        message: 'Server not found on this network',
        error: 'NETWORK_ERROR'
      });
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
    document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 100}; SameSite=Lax`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
    document.cookie = 'authToken=; path=/; max-age=0';
  }
}

export function loadAuthToken() {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('authToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
}

export function getCurrentServerURL() {
  return connectionManager.getServerURL();
}

export async function reconnectToServer() {
  return await connectionManager.forceReconnect();
}

if (typeof window !== 'undefined') {
  loadAuthToken();
}

export default api;