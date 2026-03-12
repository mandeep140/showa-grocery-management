'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { loadAuthToken, setAuthToken } from '@/util/api';

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
      const { status: s } = e.detail;
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

  const cfg = {
    connecting:   { bg: 'bg-yellow-500', text: 'Connecting to server...', pulse: true },
    reconnecting: { bg: 'bg-yellow-500', text: 'Reconnecting to server...', pulse: true },
    disconnected: { bg: 'bg-red-600',    text: 'Disconnected from server', pulse: false },
    connected:    { bg: 'bg-green-600',  text: 'Connected to server',      pulse: false },
  }[status] || { bg: 'bg-gray-600', text: 'Unknown', pulse: false };

  const handleRetry = async () => {
    const cm = (await import('@/util/ConnectionManager')).default;
    cm.forceReconnect();
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-9999 ${cfg.bg} text-white text-sm py-2 px-4 flex items-center justify-center gap-3 shadow-lg transition-all duration-300`}>
      {cfg.pulse && (
        <span className='relative flex h-2.5 w-2.5'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75' />
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-white' />
        </span>
      )}
      <span className='font-medium'>{cfg.text}</span>
      {status === 'disconnected' && (
        <button onClick={handleRetry} className='ml-2 px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition'>
          Retry
        </button>
      )}
    </div>
  );
}

function AppBlockedOverlay() {
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [blockType, setBlockType] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setBlocked(true);
      setMessage(e.detail?.message || 'Access denied.');
      setBlockType(e.detail?.type || 'blocked');
    };
    window.addEventListener('app-blocked', handler);
    return () => window.removeEventListener('app-blocked', handler);
  }, []);

  useEffect(() => {
    const checkDemo = async () => {
      try {
        const cm = (await import('@/util/ConnectionManager')).default;
        const serverURL = cm.getServerURL();
        if (!serverURL) return;
        const res = await fetch(`${serverURL}/api/auth/demo-status`);
        const data = await res.json();
        if (data.success && data.demo?.expired) {
          setBlocked(true);
          setBlockType('demo_expired');
          setMessage(data.demo.message || 'Demo period has expired.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch {}
    };
    checkDemo();
    const interval = setInterval(checkDemo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!blocked) return null;

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
  };

  const cfg = config[blockType] || { title: 'Access Denied', icon: config.store_inactive.icon, iconBg: 'bg-red-100' };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className={`w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {cfg.icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{cfg.title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => { window.location.href = '/login'; }}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = loadAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const userData = localStorage.getItem('adminUser');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Employees',
      path: '/dashboard/employees',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Roles',
      path: '/dashboard/roles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      name: 'Backup & Restore',
      path: '/dashboard/backup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      )
    },
    {
      name: 'Reports',
      path: '/dashboard/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Data Management',
      path: '/dashboard/data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      )
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppBlockedOverlay />
      <ConnectionStatusBanner />
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 shadow-2xl transition-all duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-gray-700 ${sidebarOpen ? 'px-4 justify-between' : 'px-3 justify-center'}`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Showa Admin</h1>
                <p className="text-xs text-gray-400">Management Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition ${sidebarOpen ? '' : 'mx-auto'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                title={!sidebarOpen ? item.name : ''}
                className={`flex items-center rounded-lg transition-all duration-150 group ${
                  sidebarOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'
                } ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-gray-700">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center px-2 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.role_name}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-full p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find((item) => item.path === pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden md:block">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}