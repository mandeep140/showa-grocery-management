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

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <PermissionDeniedListener>
        <PermissionProvider>
          <ConnectionStatusBanner />
          {children}
        </PermissionProvider>
      </PermissionDeniedListener>
    </ToastProvider>
  )
}