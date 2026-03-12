'use client';
import api, { setAuthToken, loadAuthToken, getCurrentServerURL, reconnectToServer } from '../util/api';
export async function login(username, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data.success) {
      setAuthToken(response.data.token);
      return response.data;
    }
    
    return response.data;
  } catch (error) {
    if (error.error === 'NETWORK_ERROR') {
      return {
        success: false,
        message: 'Server not found on this network. Please check your connection.'
      };
    }
    
    if (error.response?.data?.code === 'DEMO_EXPIRED') {
      return {
        success: false,
        message: error.response.data.message || 'Demo period has expired. Please contact support.',
        code: 'DEMO_EXPIRED'
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
}

export async function register(userData) {
  try {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    if (error.error === 'NETWORK_ERROR') {
      return {
        success: false,
        message: 'Server not found on this network'
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
    };
  }
}

export function logout() {
  setAuthToken(null);
  window.location.href = '/login';
}

export function getServerURL() {
  return getCurrentServerURL();
}

export async function forceReconnect() {
  return await reconnectToServer();
}

export function isAuthenticated() {
  return !!loadAuthToken();
}
