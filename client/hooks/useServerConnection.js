'use client';

import { useState, useEffect, useCallback } from 'react';
import connectionManager from '../util/ConnectionManager';

export function useServerConnection() {
  const [status, setStatus] = useState(() => connectionManager.getStatus());
  const [serverURL, setServerURL] = useState(() => connectionManager.getServerURL());

  useEffect(() => {
    const handler = (e) => {
      setStatus(e.detail.status);
      setServerURL(e.detail.serverURL);
    };
    window.addEventListener('connection-status-change', handler);
    return () => window.removeEventListener('connection-status-change', handler);
  }, []);

  const reconnect = useCallback(() => connectionManager.forceReconnect(), []);

  return {
    status,         
    serverURL,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting' || status === 'connecting',
    reconnect,
  };
}


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

  return { error, isNetworkError, handleError, clearError };
}