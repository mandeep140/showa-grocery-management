'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/context/PermissionContext'
import { getCurrentServerURL } from '@/util/api'
import axios from 'axios'

const ClientTopAvatar = () => {
  const { user, loading } = usePermissions()
  const [serverStatus, setServerStatus] = useState('checking') // 'online' | 'offline' | 'checking'

  useEffect(() => {
    let interval
    const checkHealth = async () => {
      try {
        const url = getCurrentServerURL()
        if (!url) { setServerStatus('offline'); return }
        const res = await axios.get(`${url}/api/health`, { timeout: 3000 })
        setServerStatus(res.data?.status === 'ok' ? 'online' : 'offline')
      } catch {
        setServerStatus('offline')
      }
    }
    checkHealth()
    interval = setInterval(checkHealth, 15000) // check every 15s
    return () => clearInterval(interval)
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const statusColor = serverStatus === 'online' ? 'bg-green-500' : serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
  const statusLabel = serverStatus === 'online' ? 'Server connected' : serverStatus === 'offline' ? 'Server disconnected' : 'Checking...'

  return (
    <div className='fixed right-5 top-3 z-40 flex items-center gap-3 rounded-full bg-[#EAF4F3] px-3 py-1.5 sm:right-7'>
      {/* Server status dot */}
      <div className="relative group">
        <span className={`block h-2.5 w-2.5 rounded-full ${statusColor} ring-2 ring-white`} />
        {serverStatus === 'online' && (
          <span className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${statusColor} animate-ping opacity-40`} />
        )}
        <span className="absolute top-6 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {statusLabel}
        </span>
      </div>
      <div className='text-right leading-tight'>
        <p className='text-[15px] font-semibold text-[#2E3D43]'>{user?.name ?? '—'}</p>
        <p className='text-xs font-medium text-[#7D9198]'>{user?.role_name ?? '—'}</p>
      </div>
      <div className='flex h-9 w-9 items-center justify-center rounded-full border border-[#D4E4E3] bg-[#2E3D43] text-sm font-bold text-white'>
        {initials}
      </div>
    </div>
  )
}

export default ClientTopAvatar
