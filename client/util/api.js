'use client';

import axios from 'axios';
import { ensureServerConnection, loadServerIP, findServerIP, getServerURL } from './FindIP';

const SERVER_PORT = 24034;
let currentServerURL = null;
let isCheckingConnection = false;

const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function initializeServerConnection() {
  try {
    currentServerURL = await ensureServerConnection();
    api.defaults.baseURL = currentServerURL;
    return true;
  } catch (error) {
    console.error('Failed to initialize server connection:', error.message);
    return false;
  }
}

async function checkServerHealth(baseURL) {
  try {
    const response = await axios.get(`${baseURL}/api/health`, {
      timeout: 2000
    });
    return response.data?.status === 'ok';
  } catch (error) {
    return false;
  }
}

api.interceptors.request.use(
  async (config) => {
    if (config.url?.includes('/api/health')) {
      return config;
    }
    if (!currentServerURL) {
      if (isCheckingConnection) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return config;
      }
      
      isCheckingConnection = true;
      const connected = await initializeServerConnection();
      isCheckingConnection = false;
      
      if (!connected) {
        throw new Error('Server not found on this network');
      }
      
      config.baseURL = currentServerURL;
      return config;
    }
    const isHealthy = await checkServerHealth(currentServerURL);
    
    if (!isHealthy) {
      console.warn('⚠️ Server connection lost, searching for server...');
      
      if (isCheckingConnection) {
        throw new Error('Server connection check in progress');
      }
      isCheckingConnection = true;
      const newIP = await findServerIP();
      
      if (newIP) {
        currentServerURL = `http://${newIP}:${SERVER_PORT}`;
        api.defaults.baseURL = currentServerURL;
        config.baseURL = currentServerURL;
        console.log(`Server reconnected at: ${newIP}`);
      } else {
        isCheckingConnection = false;
        throw new Error('Server not found on this network');
      }
      
      isCheckingConnection = false;
    }
    
    config.baseURL = currentServerURL;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.error('Network error - server might be down');
      
      if (!isCheckingConnection) {
        isCheckingConnection = true;
        const newIP = await findServerIP();
        isCheckingConnection = false;
        
        if (newIP) {
          currentServerURL = `http://${newIP}:${SERVER_PORT}`;
          api.defaults.baseURL = currentServerURL;
          
          error.config.baseURL = currentServerURL;
          return api.request(error.config);
        }
      }
      
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
  return currentServerURL;
}

export async function reconnectToServer() {
  isCheckingConnection = false;
  currentServerURL = null;
  return await initializeServerConnection();
}

if (typeof window !== 'undefined') {
  (async () => {
    const savedURL = getServerURL();
    if (savedURL) {
      currentServerURL = savedURL;
      api.defaults.baseURL = savedURL;
      checkServerHealth(savedURL).then(isHealthy => {
        if (!isHealthy) {
          console.warn('Saved server IP not responding');
          currentServerURL = null;
        }
      });
    }
    loadAuthToken();
  })();
}

export default api;