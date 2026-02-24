'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { HiMiniMagnifyingGlass, HiOutlineQrCode, HiOutlineXMark } from 'react-icons/hi2'
import api from '@/util/api'
import BarcodeScanner from '@/component/BarcodeScanner'

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-orange-100 text-orange-700',
  unpaid: 'bg-red-100 text-red-700',
}

const paymentMethodLabel = {
  cash: 'Cash',
  upi: 'UPI',
  credit: 'Credit',
}

function InvoicePageContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)


  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      search(q)
    }
  }, [])

  const search = async (invoiceId) => {
    const id = (invoiceId ?? query).trim()
    if (!id) return
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const res = await api.get(`/api/orders/invoice/${encodeURIComponent(id)}`)
      if (res.data.success) {
        setOrder(res.data.order)
      } else {
        setError('Invoice not found.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search()
  }



  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`
  const fmtDate = (d) => d ? new Date(d + ' UTC').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="min-h-screen bg-[#E6FFFD] px-4 sm:px-8 pt-20 pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Invoice Lookup</h1>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          <HiMiniMagnifyingGlass className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter invoice number (e.g. INV-00001)..."
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setOrder(null); setError('') }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => setScannerOpen(true)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiOutlineQrCode className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => search()}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[#008C83] text-white text-sm font-semibold hover:bg-[#00756E] duration-150 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Result */}
      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 sm:p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{order.invoice_id}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{fmtDate(order.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${paymentColors[order.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.payment_status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                  {paymentMethodLabel[order.payment_method] ?? order.payment_method}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-5 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">Customer</p>
                <p className="text-sm font-semibold text-gray-800">{order.buyer_name || 'Walk-in'}</p>
                {order.buyer_phone && <p className="text-xs text-gray-500">{order.buyer_phone}</p>}
                {order.buyer_address && <p className="text-xs text-gray-400">{order.buyer_address}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Location</p>
                <p className="text-sm font-semibold text-gray-800">{order.location_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Created by</p>
                <p className="text-sm font-semibold text-gray-800">{order.created_by_name || '—'}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Items</h3>
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2.5 rounded-l-lg">Product</th>
                    <th className="text-left px-3 py-2.5">Code</th>
                    <th className="text-center px-3 py-2.5">Unit</th>
                    <th className="text-center px-3 py-2.5">Qty</th>
                    <th className="text-right px-3 py-2.5">Unit Price</th>
                    {order.items.some(i => i.discount_percent > 0) && (
                      <th className="text-right px-3 py-2.5">Disc %</th>
                    )}
                    <th className="text-right px-3 py-2.5 rounded-r-lg">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{item.product_name}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{item.product_code}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500">{item.unit}</td>
                      <td className="px-3 py-2.5 text-center font-semibold">{item.total_quantity}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">₹{item.selling_price}</td>
                      {order.items.some(i => i.discount_percent > 0) && (
                        <td className="px-3 py-2.5 text-right text-orange-500">{item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}</td>
                      )}
                      <td className="px-3 py-2.5 text-right font-bold text-gray-800">₹{Number(item.total_subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex flex-col sm:flex-row sm:justify-end px-5 sm:px-6 py-4 border-b border-gray-100">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{fmt(order.total_sell_price)}</span>
                </div>
                {Number(order.tax_amount) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span>{fmt(order.tax_amount)}</span>
                  </div>
                )}
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>Discount</span>
                    <span>− {fmt(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-800 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-[#008C83]">{fmt(order.final_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Received</span>
                  <span className="text-green-600 font-semibold">{fmt(order.received_amount)}</span>
                </div>
                {(Number(order.final_amount) - Number(order.received_amount)) > 0.01 && (
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>Due</span>
                    <span>{fmt(Number(order.final_amount) - Number(order.received_amount))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Debt info */}
            {order.debt && (
              <div className="px-5 sm:px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Debt Record</h3>
                <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Original Debt</p>
                      <p className="font-bold text-red-600">{fmt(order.debt.original_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Paid</p>
                      <p className="font-bold text-green-600">{fmt(order.debt.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Remaining</p>
                      <p className="font-bold text-red-600">{fmt(order.debt.remaining_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${order.debt.status === 'paid' ? 'bg-green-100 text-green-700' : order.debt.status === 'partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {order.debt.status}
                      </span>
                    </div>
                  </div>

                  {order.debt.payments?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Payment History</p>
                      <div className="space-y-1.5">
                        {order.debt.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-gray-600">
                            <span>{fmtDate(p.created_at)}</span>
                            <span className="font-semibold text-green-700">+{fmt(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


        </div>
      )}

      {!order && !error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300">
          <HiMiniMagnifyingGlass className="h-16 w-16 mb-4" />
          <p className="text-base font-medium">Enter an invoice number to look it up</p>
        </div>
      )}

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcodeScanned={(code, cb) => {
          setQuery(code)
          setScannerOpen(false)
          cb(true, 'Scanned: ' + code)
          search(code)
        }}
      />
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E6FFFD] pt-20 px-8 text-gray-400 text-sm">Loading...</div>}>
      <InvoicePageContent />
    </Suspense>
  )
}
