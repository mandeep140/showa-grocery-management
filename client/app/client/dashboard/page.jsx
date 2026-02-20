'use client'
import { useEffect, useState } from 'react'
import { FaBox, FaRupeeSign, FaFileAlt } from 'react-icons/fa'
import { FaArrowTrendUp, FaVanShuttle, FaRegClock } from 'react-icons/fa6'
import { GoAlertFill } from 'react-icons/go'
import { IoWarningOutline, IoAddOutline } from 'react-icons/io5'
import { FaShoppingCart } from 'react-icons/fa'
import { BsFileEarmarkBarGraphFill } from 'react-icons/bs'
import { HiMiniUserGroup } from 'react-icons/hi2'
import Link from 'next/link'
import api from '@/util/api'

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [todaySales, setTodaySales] = useState(null)
  const [todayOrders, setTodayOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiring, setExpiring] = useState({ expiring: [], expired: [] })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, salesRes, lowRes, expiryRes, actRes] = await Promise.all([
          api.get('/api/reports/dashboard'),
          api.get('/api/orders/today'),
          api.get('/api/reports/low-stock'),
          api.get('/api/reports/expiry?days=30'),
          api.get('/api/history/activity?limit=10'),
        ])
        if (dashRes.data.success) setDashboard(dashRes.data.dashboard)
        if (salesRes.data.success) {
          setTodaySales(salesRes.data.summary)
          setTodayOrders(salesRes.data.orders || [])
        }
        if (lowRes.data.success) setLowStock(lowRes.data.products || [])
        if (expiryRes.data.success) setExpiring({ expiring: expiryRes.data.expiring || [], expired: expiryRes.data.expired || [] })
        if (actRes.data.success) setActivities(actRes.data.activities || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const cards = [
    { name: 'Total Products', value: dashboard?.total_products ?? '—', icon: <FaBox />, sideIcon: <FaArrowTrendUp />, color: '#009688' },
    { name: 'Low Stock Items', value: dashboard?.low_stock ?? '—', icon: <GoAlertFill />, sideIcon: <IoWarningOutline />, color: '#FF9800' },
    { name: "Today's Sales", value: todaySales ? money(todaySales.total_sales) : '—', icon: <FaRupeeSign />, sideIcon: <FaArrowTrendUp />, color: '#4CAF50' },
    { name: 'Pending Debts', value: dashboard?.pending_customer_debts ? money(dashboard.pending_customer_debts.total) : '—', icon: <HiMiniUserGroup />, sideIcon: <FaArrowTrendUp />, color: '#F44336' },
  ]

  const quickActions = [
    { name: 'Add Product', icon: <IoAddOutline />, color: '#008C83', href: '/client/inventory/add' },
    { name: 'Open Billing', icon: <FaFileAlt />, color: '#4CAF50', href: '/client/billing' },
    { name: 'New Purchase', icon: <FaShoppingCart />, color: '#2196F3', href: '/client/purchase/add' },
    { name: 'View Reports', icon: <BsFileEarmarkBarGraphFill />, color: '#FF9800', href: '/client/reports' },
  ]

  const expiringAll = [...(expiring.expired || []), ...(expiring.expiring || [])]
  const outOfStock = lowStock.filter(p => (p.total_stock || 0) <= 0)
  const lowStockOnly = lowStock.filter(p => (p.total_stock || 0) > 0)

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#E6FFFD] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen px-8 py-20 bg-[#E6FFFD]">
      <h2 className="font-bold text-2xl text-gray-800 mb-6">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${card.color}18` }}>
              <span className="text-lg" style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">{card.name}</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{card.value}</p>
            </div>
            <span className="text-sm" style={{ color: card.color }}>{card.sideIcon}</span>
          </div>
        ))}
      </div>

      {/* Alert cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Low Stock */}
        <div className="rounded-xl border border-[#FFE0B2] bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF3E0] border-b border-[#FFE0B2]">
            <IoWarningOutline className="text-[#FF9800]" />
            <span className="text-sm font-semibold text-gray-700">Low Stock</span>
            <span className="ml-auto text-xs font-bold text-white bg-[#FF9800] rounded-full w-5 h-5 flex items-center justify-center">{lowStockOnly.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {lowStockOnly.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No low stock items</p>}
            {lowStockOnly.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-[#FFFBF5] border border-[#FFE0B2] rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-700">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.product_code}</p>
                </div>
                <p className="text-xs font-semibold text-[#FF9800]">{item.total_stock} / {item.minimum_stock_level}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-xl border border-[#FFCDD2] bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FFEBEE] border-b border-[#FFCDD2]">
            <FaRegClock className="text-[#EF5350]" />
            <span className="text-sm font-semibold text-gray-700">Expiring Soon</span>
            <span className="ml-auto text-xs font-bold text-white bg-[#EF5350] rounded-full w-5 h-5 flex items-center justify-center">{expiringAll.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {expiringAll.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No expiring items</p>}
            {expiringAll.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#FFF5F5] border border-[#FFCDD2] rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-700">{item.product_name || item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.batch_no}</p>
                </div>
                <p className="text-xs font-semibold text-[#EF5350]">{item.expire_date ? new Date(item.expire_date).toLocaleDateString('en-IN') : '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Out of Stock */}
        <div className="rounded-xl border border-[#FFCDD2] bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FFEBEE] border-b border-[#FFCDD2]">
            <FaBox className="text-[#EF5350]" />
            <span className="text-sm font-semibold text-gray-700">Out of Stock</span>
            <span className="ml-auto text-xs font-bold text-white bg-[#EF5350] rounded-full w-5 h-5 flex items-center justify-center">{outOfStock.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {outOfStock.length === 0 && <p className="text-xs text-gray-400 text-center py-4">All products in stock</p>}
            {outOfStock.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-[#FFF5F5] border border-[#FFCDD2] rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-700">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.product_code}</p>
                </div>
                <p className="text-xs font-semibold text-[#EF5350]">Out of Stock</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's sales + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-[#E8F5E9] border-b border-[#C8E6C9]">
            <FaRupeeSign className="text-[#4CAF50]" />
            <span className="text-sm font-bold text-gray-800">Today's Sales</span>
          </div>
          <div className="flex items-center gap-12 px-5 py-4 bg-gray-50 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Total Bills</p>
              <p className="text-lg font-bold text-gray-800">{todaySales?.total_orders ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Amount</p>
              <p className="text-lg font-bold text-green-600">{money(todaySales?.total_sales)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Profit</p>
              <p className="text-lg font-bold text-[#008C83]">{money(todaySales?.total_profit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Credit</p>
              <p className="text-lg font-bold text-red-500">{money(todaySales?.total_credit)}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Recent Sales</p>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {todayOrders.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No sales today</p>}
              {todayOrders.slice(0, 8).map(sale => (
                <div key={sale.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#4CAF50]"><FaFileAlt className="text-sm" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-600">{sale.invoice_id}</p>
                    <p className="text-[10px] text-gray-400">{sale.buyer_name || 'Walk-in'} · {new Date(sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-700">{money(sale.final_amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800">Quick Actions</span>
          </div>
          <div className="p-3 space-y-2">
            {quickActions.map(action => (
              <Link key={action.name} href={action.href} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:opacity-80 duration-150" style={{ backgroundColor: `${action.color}12` }}>
                <div className="p-2 rounded-lg text-white text-sm" style={{ backgroundColor: action.color }}>{action.icon}</div>
                <p className="text-sm font-medium" style={{ color: action.color }}>{action.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <FaRegClock className="text-[#2196F3] text-sm" />
          <span className="text-sm font-bold text-gray-800">Recent Activity</span>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {activities.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>}
          <div className="space-y-1">
            {activities.map((act, i) => {
              const typeConfig = {
                sale: { icon: <FaRupeeSign />, color: '#4CAF50', label: 'Sale' },
                purchase: { icon: <FaShoppingCart />, color: '#2196F3', label: 'Purchase' },
                transfer: { icon: <FaVanShuttle />, color: '#FF9800', label: 'Transfer' },
                customer_return: { icon: <FaBox />, color: '#9C27B0', label: 'Return' },
                disposal: { icon: <GoAlertFill />, color: '#F44336', label: 'Disposal' },
              }
              const cfg = typeConfig[act.activity_type] || typeConfig.sale
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${cfg.color}18` }}>
                    <span className="text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                      <span className="text-xs font-medium text-gray-700 truncate">{act.reference}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{act.related_name} · {act.user_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {act.amount != null && <p className="text-xs font-semibold text-gray-700">{money(act.amount)}</p>}
                    <p className="text-[10px] text-gray-400">{new Date(act.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
