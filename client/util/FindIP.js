'use client';

const SERVER_PORT = 24034;
const HEALTH_ENDPOINT = '/api/health';
const STORAGE_KEY = 'serverConfig';

async function getLocalIPRange() {
  if (typeof window === 'undefined') return '192.168.1';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch('/api/network-info', { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        const parts = data.ip.split('.');
        if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
  } catch (error) { /* fallback to WebRTC */ }

  if (typeof RTCPeerConnection === 'undefined') return '192.168.1';

  try {
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
          resolve('192.168.1'); 
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
        const match = candidate.match(ipRegex);
        
        if (match) {
          const ip = match[0];
          const ipParts = ip.split('.');
          if (ipParts[0] === '192' || ipParts[0] === '10' || 
              (ipParts[0] === '172' && ipParts[1] >= 16 && ipParts[1] <= 31)) {
            pc.close();
            resolve(`${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`);
          }
        }
      };
      setTimeout(() => {
        pc.close();
        resolve('192.168.1'); 
      }, 2000);
    });
  } catch (error) {
    console.error('Error getting local IP:', error);
    return '192.168.1'; 
  }
}

async function checkServerHealth(ip) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000); 
    
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

export async function findServerIP() {
  console.log('Scanning network for server...');
  const quickIPs = [];
  const savedIP = loadServerIP();
  if (savedIP) quickIPs.push(savedIP);
  quickIPs.push('127.0.0.1');
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    quickIPs.push(window.location.hostname);
  }

  for (const ip of quickIPs) {
    if (await checkServerHealth(ip)) {
      console.log(`Server found at: ${ip}:${SERVER_PORT}`);
      saveServerIP(ip);
      return ip;
    }
  }

  const baseIP = await getLocalIPRange();

  return new Promise((resolve) => {
    let found = false;
    let completed = 0;

    for (let i = 1; i <= 254; i++) {
      const ip = `${baseIP}.${i}`;
      checkServerHealth(ip).then((isHealthy) => {
        if (isHealthy && !found) {
          found = true;
          console.log(`Server found at: ${ip}:${SERVER_PORT}`);
          saveServerIP(ip);
          resolve(ip);
        }
        if (++completed === 254 && !found) {
          console.log('Server not found on network');
          resolve(null);
        }
      });
    }
  });
}

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
      console.log(`Server IP saved: ${ip}`);
    }
  } catch (error) {
    console.error('Error saving server IP:', error.message);
  }
}

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

export function getServerURL() {
  const ip = loadServerIP();
  return ip ? `http://${ip}:${SERVER_PORT}` : null;
}

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

export async function ensureServerConnection() {
  const savedIP = loadServerIP();
  if (savedIP) {
    const isValid = await checkServerHealth(savedIP);
    if (isValid) {
      console.log(`Using saved server IP: ${savedIP}`);
      return `http://${savedIP}:${SERVER_PORT}`;
    }
  }

  const foundIP = await findServerIP();
  if (foundIP) {
    return `http://${foundIP}:${SERVER_PORT}`;
  }
  
  throw new Error('Server not found on this network');
}