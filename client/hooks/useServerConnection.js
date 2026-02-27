'use client';

import { useState, useEffect } from 'react';
import { getCurrentServerURL, reconnectToServer } from '../util/api';
import { findServerIP, verifyServerIP } from '../util/FindIP';

/**
 * Hook to manage server connection status
 */
export function useServerConnection() {
  const [serverURL, setServerURL] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const url = getCurrentServerURL();
      if (url) {
        setServerURL(url);
        const isValid = await verifyServerIP();
        setIsConnected(isValid);
        
        if (!isValid) {
          setError('Server not responding');
        } else {
          setError(null);
        }
      } else {
        setIsConnected(false);
        setError('No server configured');
      }
    } catch (err) {
      setIsConnected(false);
      setError(err.message);
    }
  };

  const searchForServer = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const ip = await findServerIP();
      if (ip) {
        const url = `http://${ip}:24034`;
        setServerURL(url);
        setIsConnected(true);
        setError(null);
      } else {
        setError('Server not found on this network');
        setIsConnected(false);
      }
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsSearching(false);
    }
  };

  const reconnect = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const url = await reconnectToServer();
      if (url) {
        setServerURL(url);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    serverURL,
    isConnected,
    isSearching,
    error,
    checkConnection,
    searchForServer,
    reconnect
  };
}

/**
 * Hook for API error handling with network detection
 */
export function useApiError() {
  const [error, setError] = useState(null);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const handleError = (err) => {
    if (err?.error === 'NETWORK_ERROR' || err?.message?.includes('Server not found')) {
      setIsNetworkError(true);
      setError('Server not found on this network. Please check your connection.');
    } else if (err?.response?.data?.message) {
      setIsNetworkError(false);
      setError(err.response.data.message);
    } else {
      setIsNetworkError(false);
      setError(err?.message || 'An error occurred');
    }
  };

  const clearError = () => {
    setError(null);
    setIsNetworkError(false);
  };

  return {
    error,
    isNetworkError,
    handleError,
    clearError
  };
}
