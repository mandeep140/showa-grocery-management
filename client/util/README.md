# Server Discovery & Auto-Connect System

Yeh system automatically local LAN network par server ko dhundta hai aur har API request se pehle server ki health check karta hai.

## 🚀 Features

1. **Auto Server Discovery** - Local network (192.168.x.x) mein server ko automatically dhundta hai
2. **Health Check Middleware** - Har API request se pehle server health verify karta hai
3. **Auto Reconnect** - Agar server down ho ya IP change ho jaye toh automatically reconnect karta hai
4. **IP Caching** - Server IP ko clientData.json mein save karta hai for faster startup
5. **React Hooks** - Easy integration ke liye custom hooks

## 📁 Files Structure

```
client/
├── util/
│   ├── FindIP.js           # Server discovery logic
│   ├── api.js              # Axios instance with interceptors
│   ├── apiService.js       # API service functions
│   └── README.md           # This file
├── hooks/
│   └── useServerConnection.js  # React hooks
├── examples/
│   └── ServerConnectionExample.jsx  # Usage example
└── clientData.json         # Server IP cache
```

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install axios
```

### 2. Basic Usage

```javascript
import api from './util/api';

// Simple API call - automatic health check hoga
const response = await api.get('/api/users');
```

### 3. With Authentication

```javascript
import { login, getUsers } from './util/apiService';

// Login
const result = await login('Administrator', 'admin123');

if (result.success) {
  // Token automatically set ho jayega
  console.log('Logged in:', result.user);
}

// Ab authenticated requests kar sakte ho
const users = await getUsers();
```

### 4. React Component Example

```javascript
import { useServerConnection } from './hooks/useServerConnection';
import { login } from './util/apiService';

function LoginPage() {
  const { isConnected, searchForServer } = useServerConnection();
  
  const handleLogin = async () => {
    if (!isConnected) {
      await searchForServer();
    }
    
    const result = await login(username, password);
    // Handle result...
  };
  
  return (
    <div>
      {!isConnected && (
        <button onClick={searchForServer}>
          Search for Server
        </button>
      )}
      {/* Login form */}
    </div>
  );
}
```

## 🔍 How It Works

### Server Discovery Process

1. **Local IP Detection** - Client apna local IP detect karta hai (e.g., 192.168.1.100)
2. **Network Scan** - Same subnet ke saare IPs (1-254) ko parallel mein scan karta hai
3. **Health Check** - Har IP par `http://IP:24034/api/health` check karta hai
4. **Save IP** - Jab server mil jaye toh IP ko clientData.json mein save karta hai

### Request Flow

```
API Request
    ↓
Check if baseURL exists
    ↓
Health check on saved IP
    ↓
If healthy → Send request
If not → Search for server
    ↓
Update IP & retry
    ↓
Response
```

### Auto-Reconnect

- Har request se pehle health check
- Agar server not found → Network scan
- 1 second timeout per IP
- Parallel scanning for speed
- Automatic retry with new IP

## 📝 Configuration

### clientData.json Structure

```json
{
  "serverIP": "192.168.1.100",
  "serverPort": 24034,
  "serverURL": "http://192.168.1.100:24034",
  "lastFound": "2026-02-15T10:30:00.000Z"
}
```

### Timeouts

```javascript
// Health check timeout (FindIP.js)
const timeout = 1000; // 1 second per IP

// API request timeout (api.js)
timeout: 10000 // 10 seconds
```

## 🎯 API Service Functions

### Authentication

```javascript
import { login, register, logout } from './util/apiService';

// Login with username or phone
await login('Administrator', 'admin123');
await login('9999999999', 'admin123');

// Register
await register({ name, phone, password, role_id });

// Logout
logout();
```

### Users

```javascript
import { getUsers } from './util/apiService';

const users = await getUsers();
```

### Custom Requests

```javascript
import api from './util/api';

// GET
const data = await api.get('/api/products');

// POST
await api.post('/api/products', { name: 'Product' });

// PUT
await api.put('/api/products/1', { name: 'Updated' });

// DELETE
await api.delete('/api/products/1');
```

## 🪝 React Hooks

### useServerConnection()

```javascript
const {
  serverURL,      // Current server URL
  isConnected,    // Connection status
  isSearching,    // Currently searching
  error,          // Connection error
  checkConnection, // Manual check
  searchForServer, // Find server
  reconnect       // Force reconnect
} = useServerConnection();
```

### useApiError()

```javascript
const {
  error,          // Error message
  isNetworkError, // Is it network error?
  handleError,    // Handle error
  clearError      // Clear error
} = useApiError();

// Usage
try {
  await api.get('/api/users');
} catch (err) {
  handleError(err);
  
  if (isNetworkError) {
    // Show network error UI
  }
}
```

## 🛠️ Manual Operations

### Force Server Search

```javascript
import { findServerIP } from './util/FindIP';

const ip = await findServerIP();
console.log('Server found at:', ip);
```

### Get Current Server URL

```javascript
import { getCurrentServerURL } from './util/api';

const url = getCurrentServerURL();
```

### Force Reconnect

```javascript
import { reconnectToServer } from './util/api';

await reconnectToServer();
```

## ⚠️ Error Handling

### Network Errors

```javascript
try {
  await api.get('/api/users');
} catch (error) {
  if (error.error === 'NETWORK_ERROR') {
    console.log('Server not found on network');
    // Show UI to search for server
  }
}
```

### Response Errors

```javascript
try {
  const result = await login(username, password);
  if (!result.success) {
    console.log('Login failed:', result.message);
  }
} catch (error) {
  console.log('Request failed:', error.message);
}
```

## 🔐 Token Management

Auth token automatically manage hota hai:

```javascript
import { setAuthToken, loadAuthToken } from './util/api';

// Set token (login ke baad automatic)
setAuthToken('your-jwt-token');

// Load token (page refresh par)
const token = loadAuthToken();

// Token localStorage mein save hota hai
```

## 📱 Complete Example

```javascript
import React, { useState, useEffect } from 'react';
import { useServerConnection } from './hooks/useServerConnection';
import { login, getUsers } from './util/apiService';

function App() {
  const { isConnected, isSearching, searchForServer } = useServerConnection();
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    if (isConnected) {
      loadUsers();
    }
  }, [isConnected]);
  
  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };
  
  const handleLogin = async (username, password) => {
    const result = await login(username, password);
    if (result.success) {
      loadUsers();
    }
  };
  
  if (!isConnected && !isSearching) {
    return (
      <div>
        <h1>Server Not Found</h1>
        <button onClick={searchForServer}>
          Search for Server
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Server Connected ✅</h1>
      {/* Your app */}
    </div>
  );
}
```

## 🚨 Troubleshooting

### Server not found
- Check if server is running on port 24034
- Check if client and server are on same network
- Check firewall settings

### Slow connection
- Network scan karne mein time lagta hai (1-254 IPs)
- Already saved IP fast connect hota hai

### Connection keeps dropping
- Server stability check karo
- Network issues ho sakte hain
- Server IP change ho raha hai

## 📌 Notes

- Server ko port **24034** par run hona chahiye
- `/api/health` endpoint server par hona chahiye
- Local network (LAN) par hi kaam karega
- Internet/WAN support nahi hai (add kar sakte ho)
- IPv4 only (IPv6 support baad mein add kar sakte ho)
