'use client';

const SERVER_URL = 'http://localhost:24034';
const HEARTBEAT_INTERVAL = 10000;                         
const RECONNECT_DELAYS = [2000, 4000, 8000, 16000, 30000]; 

class ConnectionManager {
  static _instance = null;

  constructor() {
    if (ConnectionManager._instance) return ConnectionManager._instance;

    this.status = 'connecting';   
    this.serverURL = SERVER_URL;
    this._heartbeatTimer = null;
    this._reconnectTimer = null;
    this._reconnectAttempt = 0;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._onBrowserOnline());
      window.addEventListener('offline', () => this._onBrowserOffline());
      this._init();
    }

    ConnectionManager._instance = this;
  }


  async _init() {
    if (await this._ping()) {
      this._onConnected();
    } else {
      this._setStatus('disconnected');
      this._scheduleReconnect();
    }
  }


  async _ping() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${this.serverURL}/api/health`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) return false;
      const d = await res.json();
      return d.status === 'ok';
    } catch {
      return false;
    }
  }


  _setStatus(s) {
    if (this.status === s) return;
    const prev = this.status;
    this.status = s;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('connection-status-change', {
          detail: { status: s, previousStatus: prev, serverURL: this.serverURL },
        })
      );
    }
  }

  _onConnected() {
    this._reconnectAttempt = 0;
    this._setStatus('connected');
    this._startHeartbeat();
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this._heartbeatTimer = setInterval(async () => {
      if (!(await this._ping())) {
        this._stopHeartbeat();
        this._setStatus('reconnecting');
        this._attemptReconnect();
      }
    }, HEARTBEAT_INTERVAL);
  }

  _stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  _stopReconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  async _attemptReconnect() {
    this._stopReconnect();

    if (await this._ping()) {
      this._onConnected();
      return;
    }

    const delay =
      RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this._reconnectAttempt++;
    this._setStatus('disconnected');
    this._reconnectTimer = setTimeout(() => {
      this._setStatus('reconnecting');
      this._attemptReconnect();
    }, delay);
  }

  _scheduleReconnect() {
    const delay =
      RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this._reconnectAttempt++;
    this._reconnectTimer = setTimeout(() => {
      this._setStatus('reconnecting');
      this._attemptReconnect();
    }, delay);
  }

  _onBrowserOnline() {
    if (this.status !== 'connected') {
      this._reconnectAttempt = 0;
      this._setStatus('reconnecting');
      this._attemptReconnect();
    }
  }

  _onBrowserOffline() {
    this._stopHeartbeat();
    this._stopReconnect();
    this._setStatus('disconnected');
  }


  getStatus() {
    return this.status;
  }
  getServerURL() {
    return this.serverURL;
  }
  isConnected() {
    return this.status === 'connected';
  }

  notifyNetworkError() {
    if (this.status === 'connected') {
      this._stopHeartbeat();
      this._setStatus('reconnecting');
      this._attemptReconnect();
    }
  }

  async forceReconnect() {
    this._reconnectAttempt = 0;
    this._stopHeartbeat();
    this._stopReconnect();
    this._setStatus('reconnecting');
    await this._attemptReconnect();
    return this.serverURL;
  }
}

const connectionManager = new ConnectionManager();
export default connectionManager;