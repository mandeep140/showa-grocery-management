'use client';

// ============================================
// API USAGE EXAMPLES
// ============================================

import api, { setAuthToken, loadAuthToken, getCurrentServerURL, reconnectToServer } from '../util/api';

// ============================================
// AUTHENTICATION
// ============================================

// Login
export async function login(username, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data.success) {
      // Save token
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
    
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
}

// Register
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

// Logout
export function logout() {
  setAuthToken(null);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get current server URL
export function getServerURL() {
  return getCurrentServerURL();
}

// Force reconnect to server
export async function forceReconnect() {
  return await reconnectToServer();
}

// Check if logged in
export function isAuthenticated() {
  return !!loadAuthToken();
}
