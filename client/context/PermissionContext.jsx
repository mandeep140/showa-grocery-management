'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/util/api'

const PermissionContext = createContext({
  user: null,
  permissions: [],
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  refreshPermissions: () => {},
})

export function PermissionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/verify')
      if (res.data.success) {
        setUser(res.data.user)
        setPermissions(res.data.user?.permissions || [])
      }
    } catch {
      setUser(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const hasPermission = useCallback((perm) => {
    if (permissions.includes('all')) return true
    return permissions.includes(perm)
  }, [permissions])

  const hasAnyPermission = useCallback((...perms) => {
    if (permissions.includes('all')) return true
    return perms.some(p => permissions.includes(p))
  }, [permissions])

  return (
    <PermissionContext.Provider value={{ user, permissions, loading, hasPermission, hasAnyPermission, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  return useContext(PermissionContext)
}

export default PermissionContext
