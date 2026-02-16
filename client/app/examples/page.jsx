'use client';

import React, { useState } from 'react';
import { useServerConnection, useApiError } from '../../hooks/useServerConnection';
import { login, logout } from '../../util/apiService';
import api from '@/util/api';

/**
 * Example component showing server connection status and login
 */
export default function ServerConnectionExample() {
  const { 
    serverURL, 
    isConnected, 
    isSearching, 
    error: connectionError, 
    searchForServer,
    reconnect 
  } = useServerConnection();
  
  const { error: apiError, isNetworkError, handleError, clearError } = useApiError();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        api.get('/api/users')
          .then(res => setUsers(res.data.users))
          .catch(err => console.error('Failed to fetch users:', err));
        // Redirect or update state
      } else {
        handleError({ response: { data: { message: result.message } } });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Server Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-2">Server Status</h2>
        
        <div className="mb-2">
          <span className="font-semibold">Status: </span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>
        
        {serverURL && (
          <div className="mb-2">
            <span className="font-semibold">Server URL: </span>
            <span className="text-blue-600">{serverURL}</span>
          </div>
        )}
        
        {connectionError && (
          <div className="mb-2 text-red-600">
            {connectionError}
          </div>
        )}

        {users.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">Users: </span>
            <ul className="list-disc list-inside">
              {users.map(user => (
                <li key={user.id}>{user.name} ({user.phone})</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={searchForServer}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSearching ? 'Searching...' : 'Search for Server'}
          </button>
          
          <button
            onClick={reconnect}
            disabled={isSearching}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Reconnect
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        
        {apiError && (
          <div className={`p-3 mb-4 rounded ${
            isNetworkError ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {apiError}
            {isNetworkError && (
              <button
                onClick={searchForServer}
                className="ml-2 underline font-semibold"
              >
                Search for Server
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Username / Phone
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Administrator or 9999999999"
              disabled={!isConnected}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="admin123"
              disabled={!isConnected}
            />
          </div>
          
          <button
            type="submit"
            disabled={!isConnected || isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
