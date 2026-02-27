'use client';

import axios from 'axios';
const SERVER_URL = 'http://localhost:24034';

const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject({
        success: false,
        message: 'Server not available. Make sure backend is running on port 24034.',
        error: 'NETWORK_ERROR'
      });
    }
    
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || '';
      
      if ((status === 401 || status === 403) && 
          (message.toLowerCase().includes('inactive') || 
           message.toLowerCase().includes('deactivated') ||
           message.toLowerCase().includes('disabled'))) {
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          delete api.defaults.headers.common['Authorization'];
          
          const errorMsg = message.includes('role') 
            ? 'Your role has been deactivated. Please contact administrator.'
            : message.includes('Store is deactivated') ? 'Your store has been deactivated by an agency or there is an server issue, please contact us.' : 'Your account has been deactivated. Please contact administrator.';
          
          alert(errorMsg);
          window.location.href = '/login';
        }
        
        return Promise.reject({
          success: false,
          message: 'Account or role is inactive',
          error: 'ACCOUNT_INACTIVE'
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem('adminToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('adminToken');
    delete api.defaults.headers.common['Authorization'];
  }
}

export function loadAuthToken() {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('adminToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
}

export function getCurrentServerURL() {
  return SERVER_URL;
}

if (typeof window !== 'undefined') {
  loadAuthToken();
}

export default api;