'use client'

import { useEffect } from 'react'
import { PermissionProvider } from '@/context/PermissionContext'
import { ToastProvider, useToast } from '@/context/ToastContext'

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
          {children}
        </PermissionProvider>
      </PermissionDeniedListener>
    </ToastProvider>
  )
}
