'use client';

const SERVER_PORT = 24034;
const HEALTH_ENDPOINT = '/api/health';
const STORAGE_KEY = 'serverConfig';

// Get local IP range using WebRTC
async function getLocalIPRange() {
  // Return default if not in browser
  if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
    return '192.168.1';
  }
  
  try {
    // Try to get local IP using WebRTC
    const pc = new RTCPeerConnection({
      iceServers: []
    });
    
    pc.createDataChannel('');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          pc.close();
          resolve('192.168.1'); // Fallback
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
        const match = candidate.match(ipRegex);
        
        if (match) {
          const ip = match[0];
          const ipParts = ip.split('.');
          
          // Check if it's a private IP
          if (ipParts[0] === '192' || ipParts[0] === '10' || 
              (ipParts[0] === '172' && ipParts[1] >= 16 && ipParts[1] <= 31)) {
            pc.close();
            resolve(`${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`);
          }
        }
      };
      
      // Timeout after 2 seconds
      setTimeout(() => {
        pc.close();
        resolve('192.168.1'); // Fallback
      }, 2000);
    });
  } catch (error) {
    console.error('Error getting local IP:', error);
    return '192.168.1'; // Fallback
  }
}

// Check if server is running on specific IP
async function checkServerHealth(ip) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000); // 1 second timeout
    
    const response = await fetch(`http://${ip}:${SERVER_PORT}${HEALTH_ENDPOINT}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Scan network for server
export async function findServerIP() {
  console.log('🔍 Scanning network for server...');
  
  const baseIP = await getLocalIPRange();
  const promises = [];
  
  // Scan range 1-254
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIP}.${i}`;
    promises.push(
      checkServerHealth(ip).then(isHealthy => {
        if (isHealthy) {
          console.log(`✅ Server found at: ${ip}:${SERVER_PORT}`);
          return ip;
        }
        return null;
      })
    );
  }
  
  const results = await Promise.all(promises);
  const serverIP = results.find(ip => ip !== null);
  
  if (serverIP) {
    saveServerIP(serverIP);
    return serverIP;
  } else {
    console.log('❌ Server not found on network');
    return null;
  }
}

// Save server IP to localStorage
function saveServerIP(ip) {
  try {
    const config = {
      serverIP: ip,
      serverPort: SERVER_PORT,
      serverURL: `http://${ip}:${SERVER_PORT}`,
      lastFound: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      console.log(`💾 Server IP saved: ${ip}`);
    }
  } catch (error) {
    console.error('Error saving server IP:', error.message);
  }
}

// Load server IP from localStorage
export function loadServerIP() {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const config = JSON.parse(data);
        return config.serverIP || null;
      }
    }
  } catch (error) {
    console.error('Error loading server IP:', error.message);
  }
  return null;
}

// Get server URL
export function getServerURL() {
  const ip = loadServerIP();
  return ip ? `http://${ip}:${SERVER_PORT}` : null;
}

// Verify current server IP is still valid
export async function verifyServerIP() {
  const ip = loadServerIP();
  if (!ip) return false;
  
  const isHealthy = await checkServerHealth(ip);
  if (!isHealthy) {
    console.log('⚠️ Saved server IP is no longer responding');
    return false;
  }
  
  return true;
}

// Main function to get or find server IP
export async function ensureServerConnection() {
  // First check saved IP
  const savedIP = loadServerIP();
  if (savedIP) {
    const isValid = await checkServerHealth(savedIP);
    if (isValid) {
      console.log(`✅ Using saved server IP: ${savedIP}`);
      return `http://${savedIP}:${SERVER_PORT}`;
    }
  }
  
  // If saved IP doesn't work, scan network
  const foundIP = await findServerIP();
  if (foundIP) {
    return `http://${foundIP}:${SERVER_PORT}`;
  }
  
  throw new Error('Server not found on this network');
}
