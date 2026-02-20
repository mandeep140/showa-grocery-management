'use client'

import { useState, useEffect } from 'react'
import { tabs, pillStyles, money, buildSalesContent, buildInventoryContent, buildPurchaseContent, buildLossContent } from './report-config'
import { SummaryCards, TabsCard, ReportTable } from '@/component/ReportComponents'
import { FiCalendar } from 'react-icons/fi'
import api from '@/util/api'

function getDateRange(preset) {
  const today = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { start_date: fmt(today), end_date: fmt(today) }
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return { start_date: fmt(y), end_date: fmt(y) }
    }
    case '7days': {
      const d = new Date(today)
      d.setDate(d.getDate() - 7)
      return { start_date: fmt(d), end_date: fmt(today) }
    }
    case '30days': {
      const d = new Date(today)
      d.setDate(d.getDate() - 30)
      return { start_date: fmt(d), end_date: fmt(today) }
    }
    default:
      return {}
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const [datePreset, setDatePreset] = useState('7days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [activeTab, datePreset, customStart, customEnd])

  const loadReport = async () => {
    setLoading(true)
    const range = datePreset === 'custom'
      ? { start_date: customStart, end_date: customEnd }
      : getDateRange(datePreset)

    try {
      switch (activeTab) {
        case 'sales': {
          const params = new URLSearchParams()
          if (range.start_date) params.set('start_date', range.start_date)
          if (range.end_date) params.set('end_date', range.end_date)
          const res = await api.get(`/api/reports/sales?${params}`)
          if (res.data.success) {
            setContent(buildSalesContent(res.data.orders || [], res.data.summary))
          }
          break
        }
        case 'inventory': {
          const res = await api.get('/api/reports/inventory')
          if (res.data.success) {
            setContent(buildInventoryContent(res.data.products || [], res.data.summary))
          }
          break
        }
        case 'purchase': {
          const params = new URLSearchParams()
          if (range.start_date) params.set('start_date', range.start_date)
          if (range.end_date) params.set('end_date', range.end_date)
          const res = await api.get(`/api/reports/purchases?${params}`)
          if (res.data.success) {
            setContent(buildPurchaseContent(res.data.purchases || [], res.data.summary))
          }
          break
        }
        case 'loss': {
          const params = new URLSearchParams()
          if (range.start_date) params.set('start_date', range.start_date)
          if (range.end_date) params.set('end_date', range.end_date)
          const res = await api.get(`/api/disposal?${params}`)
          if (res.data.success) {
            setContent(buildLossContent(res.data.disposals || []))
          }
          break
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const dateButtons = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '7days', label: 'Last 7 Days' },
    { key: '30days', label: 'Last 30 Days' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="min-h-screen bg-[#E6FFFD] px-6 pb-10 pt-20 md:px-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="mt-1 text-sm text-gray-400">View business reports and analytics</p>
        </header>

        {/* Date Range */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
            <FiCalendar className="h-3.5 w-3.5 text-[#008C83]" /> Date Range
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {dateButtons.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => setDatePreset(b.key)}
                className={`h-8 px-3.5 rounded-lg border text-xs font-medium cursor-pointer duration-150 ${
                  datePreset === b.key
                    ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {b.label}
              </button>
            ))}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 px-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#008C83]"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 px-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#008C83]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <TabsCard tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content */}
        {loading ? (
          <div className="mt-6 text-center py-12 text-sm text-gray-400">Loading report...</div>
        ) : content ? (
          <>
            <SummaryCards cards={content.cards} />
            <ReportTable content={content} pillStyles={pillStyles} />
          </>
        ) : (
          <div className="mt-6 text-center py-12 text-sm text-gray-400">No data available</div>
        )}
      </div>
    </div>
  )
}
