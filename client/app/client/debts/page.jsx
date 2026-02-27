'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiArrowDownLeft, FiArrowUpRight, FiPhone, FiUser, FiX } from 'react-icons/fi'
import { HiMiniMagnifyingGlass } from 'react-icons/hi2'
import { FaWallet } from 'react-icons/fa6'
import api from '@/util/api'

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function DebtsPage() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState({ total_remaining: 0, total_amount: 0, total_paid: 0, customers_with_debt: 0 })
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDebts, setCustomerDebts] = useState([])
  const [customerSummary, setCustomerSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Payment modal
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => { loadDebts() }, [])

  const loadDebts = async () => {
    try {
      const res = await api.get('/api/reports/debts')
      if (res.data.success) {
        setCustomers(res.data.by_customer)
        setSummary(res.data.summary)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const selectCustomer = async (cust) => {
    setSelectedCustomer(cust)
    try {
      const res = await api.get(`/api/customers/${cust.id}/debts`)
      if (res.data.success) {
        setCustomerDebts(res.data.debts)
        setCustomerSummary(res.data.summary)
      }
    } catch (err) { console.error(err) }
  }

  const openPayModal = () => {
    setPayAmount('')
    setPayMethod('cash')
    setPayNotes('')
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    if (paying) return
    const amt = Number(payAmount)
    if (!amt || amt <= 0) return alert('Enter a valid amount')
    setPaying(true)
    try {
      const res = await api.post(`/api/customers/${selectedCustomer.id}/pay-debt`, {
        amount: amt,
        payment_method: payMethod,
        notes: payNotes || null,
      })
      if (res.data.success) {
        alert('Payment recorded successfully')
        setPayModalOpen(false)
        loadDebts()
        selectCustomer(selectedCustomer)
      } else {
        alert(res.data.message || 'Payment failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed')
    } finally { setPaying(false) }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.includes(query)
  )

  return (
    <div className="min-h-screen w-full bg-[#E6FFFD] px-6 pb-8 pt-20">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{money(summary.total_remaining)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Total Debt Amount</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{money(summary.total_amount)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Total Recovered</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{money(summary.total_paid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Customers with Debt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.customers_with_debt}</p>
        </div>
      </div>

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] rounded-xl border border-gray-200 bg-white min-h-[70vh]">
        {/* LEFT: Customer list */}
        <aside className="border-r border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-base font-bold text-gray-800">Credit Holders</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Outstanding: <span className="text-red-500 font-semibold">{money(summary.total_remaining)}</span>
            </p>
            <div className="relative mt-3">
              <HiMiniMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#008C83]"
              />
            </div>
          </div>

          <div className="max-h-[58vh] overflow-y-auto">
            {loading && <p className="px-4 py-8 text-center text-sm text-gray-400">Loading...</p>}
            {!loading && filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">No customers with pending debts</p>}
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCustomer(c)}
                className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors cursor-pointer ${
                  selectedCustomer?.id === c.id ? 'bg-[#E6FFFD]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 font-bold text-sm">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone || 'No phone'} · {c.debt_count} bills</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-500">{money(c.total_remaining)}</p>
                  <p className="text-[10px] text-gray-400">due</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT: Detail */}
        <section className="flex flex-col">
          {!selectedCustomer ? (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                  <FaWallet className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">Select a Customer</h3>
                <p className="mt-1 text-sm text-gray-400 max-w-xs mx-auto">Choose from the list to view debts and record payments</p>
              </div>
            </div>
          ) : (
            <>
              {/* Customer header */}
              <div className="border-b border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#008C83] text-white text-lg font-bold">
                      {selectedCustomer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{selectedCustomer.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {selectedCustomer.phone && (
                          <span className="inline-flex items-center gap-1"><FiPhone className="h-3 w-3" />{selectedCustomer.phone}</span>
                        )}
                        <span>{selectedCustomer.debt_count} pending bills</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Outstanding</p>
                      <p className="text-xl font-bold text-red-500">{money(customerSummary?.total_remaining ?? selectedCustomer.total_remaining)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={openPayModal}
                      className="h-9 px-5 rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#007571] duration-150 cursor-pointer"
                    >
                      Receive Payment
                    </button>
                  </div>
                </div>

                {/* Mini summary */}
                {customerSummary && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                      <p className="text-[10px] text-gray-400">Total Debt</p>
                      <p className="text-sm font-bold text-gray-700">{money(customerSummary.total_debt)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                      <p className="text-[10px] text-gray-400">Paid</p>
                      <p className="text-sm font-bold text-green-600">{money(customerSummary.total_paid)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                      <p className="text-[10px] text-gray-400">Remaining</p>
                      <p className="text-sm font-bold text-red-500">{money(customerSummary.total_remaining)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Debts list */}
              <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Debt Records ({customerDebts.length})</h4>
                {customerDebts.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No debt records</p>
                )}
                <div className="flex flex-col gap-3">
                  {customerDebts.map(debt => (
                    <div key={debt.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            <Link href={`/client/invoice?q=${debt.invoice_id}`} className="hover:underline hover:text-[#008C83]">{debt.invoice_id}</Link>
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            debt.status === 'paid' ? 'bg-green-50 text-green-600' :
                            debt.status === 'partial' ? 'bg-orange-50 text-orange-600' :
                            'bg-red-50 text-red-500'
                          }`}>{debt.status}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(debt.created_at + ' UTC').toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Total</p>
                          <p className="font-semibold text-gray-700">{money(debt.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Paid</p>
                          <p className="font-semibold text-green-600">{money(debt.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Due</p>
                          <p className="font-semibold text-red-500">{money(debt.amount_remaining)}</p>
                        </div>
                      </div>

                      {/* Payment history */}
                      {debt.payments && debt.payments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-[10px] text-gray-400 font-medium mb-1.5">Payments</p>
                          {debt.payments.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-500">
                                  <FiArrowDownLeft className="h-3 w-3" />
                                </span>
                                <span className="text-gray-500">{new Date(p.created_at + ' UTC').toLocaleDateString('en-IN')}</span>
                                <span className="text-gray-400 capitalize">{p.payment_method}</span>
                              </div>
                              <span className="font-semibold text-green-600">+{money(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Payment Modal */}
      {payModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Receive Payment</h3>
              <button type="button" onClick={() => setPayModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-[#E6FFFD] p-4 text-center mb-4">
              <p className="text-xs text-gray-500">Due from {selectedCustomer.name}</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{money(customerSummary?.total_remaining ?? selectedCustomer.total_remaining)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83]"
                  placeholder="Enter amount"
                />
                {payAmount && (
                  <p className="text-xs text-gray-400 mt-1">
                    Remaining after payment: <span className="font-semibold text-gray-600">{money(Math.max(0, (customerSummary?.total_remaining ?? selectedCustomer.total_remaining) - (Number(payAmount) || 0)))}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {['cash', 'upi', 'bank'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border capitalize cursor-pointer duration-150 ${
                        payMethod === m ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]' : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83]"
                  placeholder="e.g. Monthly installment"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={paying || !payAmount}
              className="mt-4 h-11 w-full rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#007571] duration-150 disabled:opacity-50 cursor-pointer"
            >
              {paying ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
