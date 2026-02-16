'use client';

import axios from 'axios';
import { ensureServerConnection, loadServerIP, findServerIP, getServerURL } from './FindIP';

const SERVER_PORT = 24034;
let currentServerURL = null;
let isCheckingConnection = false;

// Create axios instance
const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Initialize server connection
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

// Check server health
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

// Request interceptor - verify connection before each request
api.interceptors.request.use(
  async (config) => {
    // Skip health check for health endpoint itself
    if (config.url?.includes('/api/health')) {
      return config;
    }

    // If no base URL set, initialize connection
    if (!currentServerURL) {
      if (isCheckingConnection) {
        // Wait for ongoing connection check
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

    // Verify existing connection
    const isHealthy = await checkServerHealth(currentServerURL);
    
    if (!isHealthy) {
      console.warn('⚠️ Server connection lost, searching for server...');
      
      if (isCheckingConnection) {
        throw new Error('Server connection check in progress');
      }
      
      isCheckingConnection = true;
      
      // Try to find server again
      const newIP = await findServerIP();
      
      if (newIP) {
        currentServerURL = `http://${newIP}:${SERVER_PORT}`;
        api.defaults.baseURL = currentServerURL;
        config.baseURL = currentServerURL;
        console.log(`✅ Server reconnected at: ${newIP}`);
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

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Network error - server might be down
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.error('Network error - server might be down');
      
      // Try to reconnect
      if (!isCheckingConnection) {
        isCheckingConnection = true;
        const newIP = await findServerIP();
        isCheckingConnection = false;
        
        if (newIP) {
          currentServerURL = `http://${newIP}:${SERVER_PORT}`;
          api.defaults.baseURL = currentServerURL;
          
          // Retry the original request
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

// Helper function to set auth token
export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }
}

// Load auth token from localStorage
export function loadAuthToken() {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('authToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
}

// Get current server URL
export function getCurrentServerURL() {
  return currentServerURL;
}

// Force reconnect
export async function reconnectToServer() {
  isCheckingConnection = false;
  currentServerURL = null;
  return await initializeServerConnection();
}

// Initialize on module load
if (typeof window !== 'undefined') {
  (async () => {
    const savedURL = getServerURL();
    if (savedURL) {
      currentServerURL = savedURL;
      api.defaults.baseURL = savedURL;
      
      // Verify in background
      checkServerHealth(savedURL).then(isHealthy => {
        if (!isHealthy) {
          console.warn('Saved server IP not responding');
          currentServerURL = null;
        }
      });
    }
    
    // Load auth token if exists
    loadAuthToken();
  })();
}

export default api;
