'use client'

import { useEffect, useState, useRef } from 'react'
import { PermissionProvider } from '@/context/PermissionContext'
import { ToastProvider, useToast } from '@/context/ToastContext'

function ConnectionStatusBanner() {
  const [status, setStatus] = useState('connecting');
  const [show, setShow] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    import('@/util/ConnectionManager').then((mod) => {
      const cm = mod.default;
      setStatus(cm.getStatus());
      setShow(cm.getStatus() !== 'connected');
    });

    const handler = (e) => {
      const { status: s, previousStatus } = e.detail;
      setStatus(s);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      if (s === 'connected') {
        setShow(true);
        hideTimerRef.current = setTimeout(() => setShow(false), 2000);
      } else {
        setShow(true);
      }
    };

    window.addEventListener('connection-status-change', handler);
    return () => {
      window.removeEventListener('connection-status-change', handler);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!show) return null;

  const config = {
    connecting: {
      bg: 'bg-yellow-500',
      text: 'Connecting to server...',
      pulse: true,
    },
    reconnecting: {
      bg: 'bg-yellow-500',
      text: 'Reconnecting to server...',
      pulse: true,
    },
    disconnected: {
      bg: 'bg-red-600',
      text: 'Disconnected from server',
      pulse: false,
    },
    connected: {
      bg: 'bg-green-600',
      text: 'Connected to server',
      pulse: false,
    },
  }[status] || { bg: 'bg-gray-600', text: 'Unknown', pulse: false };

  const handleRetry = async () => {
    const cm = (await import('@/util/ConnectionManager')).default;
    cm.forceReconnect();
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-9999 ${config.bg} text-white text-sm py-2 px-4 flex items-center justify-center gap-3 shadow-lg transition-all duration-300`}
    >
      {config.pulse && (
        <span className='relative flex h-2.5 w-2.5'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75' />
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-white' />
        </span>
      )}
      <span className='font-medium'>{config.text}</span>
      {status === 'disconnected' && (
        <button
          onClick={handleRetry}
          className='ml-2 px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition'
        >
          Retry
        </button>
      )}
    </div>
  );
}

function PermissionDeniedListener({ children }) {
  const { showToast } = useToast()

  useEffect(() => {
    const handler = (e) => {
      showToast(e.detail?.message || 'Access denied — insufficient permissions', 'error')
    }
    window.addEventListener('permission-denied', handler)
    return () => window.removeEventListener('permission-denied', handler)
  }, [showToast])

  return children
}

function AppBlockedOverlay() {
  const [blocked, setBlocked] = useState(false)
  const [message, setMessage] = useState('')
  const [blockType, setBlockType] = useState('')

  useEffect(() => {
    const handler = (e) => {
      setBlocked(true)
      setMessage(e.detail?.message || 'Access denied.')
      setBlockType(e.detail?.type || 'blocked')
    }
    window.addEventListener('app-blocked', handler)
    return () => window.removeEventListener('app-blocked', handler)
  }, [])

  useEffect(() => {
    const checkDemo = async () => {
      try {
        const cm = (await import('@/util/ConnectionManager')).default
        const serverURL = cm.getServerURL()
        if (!serverURL) return
        const res = await fetch(`${serverURL}/api/auth/demo-status`)
        const data = await res.json()
        if (data.success && data.demo?.expired) {
          setBlocked(true)
          setBlockType('demo_expired')
          setMessage(data.demo.message || 'Demo period has expired.')
          localStorage.removeItem('authToken')
          document.cookie = 'authToken=; path=/; max-age=0'
        }
      } catch {}
    }
    checkDemo()
    const interval = setInterval(checkDemo, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!blocked) return null

  const config = {
    demo_expired: {
      title: 'Demo Expired',
      icon: (
        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-amber-100'
    },
    store_inactive: {
      title: 'Store Deactivated',
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      iconBg: 'bg-red-100'
    },
    account_inactive: {
      title: 'Account Deactivated',
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      iconBg: 'bg-red-100'
    }
  }

  const cfg = config[blockType] || { title: 'Access Denied', icon: config.store_inactive.icon, iconBg: 'bg-red-100' }

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className={`w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {cfg.icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{cfg.title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => { window.location.href = '/login' }}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <PermissionDeniedListener>
        <PermissionProvider>
          <AppBlockedOverlay />
          <ConnectionStatusBanner />
          {children}
        </PermissionProvider>
      </PermissionDeniedListener>
    </ToastProvider>
  )
}