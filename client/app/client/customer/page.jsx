'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HiMiniMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2'
import { FiPhone, FiMapPin, FiFileText, FiPlus } from 'react-icons/fi'
import api from '@/util/api'

export default function CustomerPage() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [debts, setDebts] = useState([])
  const [debtSummary, setDebtSummary] = useState(null)
  const [debtPaymentsList, setDebtPaymentsList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '', email: '', notes: '' })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/customers?is_active=1')
      if (res.data.success) setCustomers(res.data.customers)
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerDetail = useCallback(async (id) => {
    setDetailLoading(true)
    try {
      const [detailRes, debtsRes, ordersRes] = await Promise.all([
        api.get(`/api/customers/${id}`),
        api.get(`/api/customers/${id}/debts`),
        api.get(`/api/customers/${id}/orders`),
      ])

      if (detailRes.data.success) setCustomerDetail(detailRes.data.customer)
      if (debtsRes.data.success) {
        setDebts(debtsRes.data.debts)
        setDebtSummary(debtsRes.data.summary)
      }
      if (ordersRes.data.success) setTransactions(ordersRes.data.orders)
      if (detailRes.data.success && detailRes.data.customer.debt_payments) {
        setDebtPaymentsList(detailRes.data.customer.debt_payments)
      }
    } catch (err) {
      console.error('Failed to load customer detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    loadCustomerDetail(customer.id)
  }

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0)

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  )

  const openPaymentModal = () => {
    setPaymentAmount('')
    setPaymentMethod('cash')
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return alert('Enter a valid amount')
    if (paymentSubmitting) return

    setPaymentSubmitting(true)
    try {
      const res = await api.post(`/api/customers/${selectedCustomer.id}/pay-debt`, {
        amount,
        payment_method: paymentMethod,
        notes: null,
      })
      if (res.data.success) {
        alert('Payment recorded successfully!')
        setShowPaymentModal(false)
        loadCustomerDetail(selectedCustomer.id)
        loadCustomers()
      } else {
        alert(res.data.message || 'Failed to record payment')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!customerForm.name.trim()) return alert('Name is required')
    try {
      const res = await api.post('/api/customers', {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        address: customerForm.address.trim() || null,
        email: customerForm.email.trim() || null,
        notes: customerForm.notes.trim() || null,
      })
      if (res.data.success) {
        alert('Customer created!')
        setShowAddModal(false)
        setCustomerForm({ name: '', phone: '', address: '', email: '', notes: '' })
        loadCustomers()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer')
    }
  }

  const remainingBalance = customerDetail?.total_debt || 0
  const advanceBalance = customerDetail?.advance_balance || 0
  const currentDueAmount = remainingBalance

  return (
    <div className="min-h-screen bg-[#E6FFFD] px-4 pb-6 pt-16 sm:px-6 lg:px-8 lg:pt-10">
      <div className="flex h-auto flex-col items-start gap-4 lg:h-[calc(100vh-6rem)] lg:flex-row lg:gap-5">
        <div className="h-[42vh] w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm sm:h-[46vh] lg:h-full lg:w-70">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-800">Customers</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="p-1.5 rounded-lg text-[#008C83] hover:bg-[#E6FFFD] duration-150 cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[12px] text-gray-400 mb-3">
              Total Outstanding <span className="font-semibold text-red-500">₹{totalOutstanding.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 bg-gray-50/50">
              <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center py-8 text-sm text-gray-400">Loading...</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">No customers found</p>
            ) : (
              filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center gap-3 hover:bg-[#E6FFFD] cursor-pointer duration-100 ${
                    selectedCustomer?.id === customer.id ? 'bg-[#E6FFFD] border-l-2 border-l-[#008C83]' : ''
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 ${
                    ['bg-[#008C83]', 'bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'][customer.id % 6]
                  }`}>
                    {customer.name?.[0]?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{customer.name}</p>
                    {customer.phone && <p className="text-[11px] text-gray-400">{customer.phone}</p>}
                  </div>
                  {customer.total_debt > 0 && (
                    <span className="text-[12px] font-semibold text-red-500 flex-shrink-0">₹{customer.total_debt.toLocaleString()}</span>
                  )}
                  {customer.total_debt === 0 && customer.advance_balance > 0 && (
                    <span className="text-[11px] font-semibold text-blue-500 flex-shrink-0">+₹{customer.advance_balance.toLocaleString()}</span>
                  )}
                  {customer.total_debt === 0 && (!customer.advance_balance || customer.advance_balance <= 0) && (
                    <span className="text-[11px] text-green-500 flex-shrink-0">₹0</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Customer detail */}
        <div className="h-auto w-full flex-1 overflow-y-visible lg:h-full lg:overflow-y-auto">
          {!selectedCustomer ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-500 mb-1">Select a Customer</h3>
                <p className="text-sm text-gray-400">Choose a customer from the list to view their<br />credit history, outstanding balance, and manage payments.</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading customer details...</p>
            </div>
          ) : customerDetail ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${
                      ['bg-[#008C83]', 'bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'][customerDetail.id % 6]
                    }`}>
                      {customerDetail.name?.[0]?.toUpperCase()}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{customerDetail.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-gray-400">
                        {customerDetail.phone && (
                          <span className="flex items-center gap-1"><FiPhone className="h-3.5 w-3.5" />{customerDetail.phone}</span>
                        )}
                        {customerDetail.address && (
                          <span className="flex items-center gap-1"><FiMapPin className="h-3.5 w-3.5" />{customerDetail.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-start justify-between gap-4 lg:w-auto lg:items-center">
                    <div className="text-left lg:text-right">
                      <p className="text-[12px] text-gray-400">Current Outstanding Balance</p>
                      <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ₹{remainingBalance.toLocaleString()}
                      </p>
                      {advanceBalance > 0 && (
                        <p className="text-[12px] text-blue-500 font-semibold mt-0.5">Advance: ₹{advanceBalance.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={openPaymentModal}
                        disabled={remainingBalance <= 0}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#008C83] px-4 text-sm font-medium text-white duration-150 hover:bg-[#00756E] cursor-pointer disabled:opacity-40"
                      >
                        Receive Payment
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3 xl:grid-cols-5">
                  <div>
                    <p className="text-[12px] text-gray-400">Total Orders</p>
                    <p className="text-lg font-bold text-gray-800">{customerDetail.stats?.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400">Total Purchase</p>
                    <p className="text-lg font-bold text-gray-800">₹{(customerDetail.stats?.total_purchase_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400">Total Paid</p>
                    <p className="text-lg font-bold text-green-600">₹{(customerDetail.stats?.total_paid || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400">Outstanding</p>
                    <p className="text-lg font-bold text-red-500">₹{remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400">Advance</p>
                    <p className="text-lg font-bold text-blue-500">₹{advanceBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[12px]">
                        <th className="text-left px-5 py-3 font-medium">Date</th>
                        <th className="text-left px-5 py-3 font-medium">Invoice</th>
                        <th className="text-left px-5 py-3 font-medium">Type</th>
                        <th className="text-right px-5 py-3 font-medium">Amount</th>
                        <th className="text-center px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Merge orders and debt payments into unified timeline
                        const timeline = []
                        
                        // Add orders
                        transactions.forEach(order => {
                          timeline.push({
                            id: `order-${order.id}`,
                            date: order.created_at,
                            invoice: order.invoice_id,
                            type: order.status === 'cancelled' ? 'Cancelled' : 'Purchase',
                            amount: order.final_amount || 0,
                            received: order.received_amount || 0,
                            isDebit: true,
                            status: order.status === 'cancelled' ? 'cancelled' : order.payment_status,
                            isCancelled: order.status === 'cancelled'
                          })
                        })
                        
                        // Add debt payments
                        debtPaymentsList.forEach(dp => {
                          timeline.push({
                            id: `payment-${dp.id}`,
                            date: dp.created_at,
                            invoice: dp.invoice_id || '—',
                            type: dp.notes?.includes('Auto-applied') ? 'Auto Payment' : 'Debt Payment',
                            amount: dp.amount || 0,
                            isDebit: false,
                            status: 'paid',
                            paymentMethod: dp.payment_method,
                            notes: dp.notes
                          })
                        })
                        
                        // Sort by date descending
                        timeline.sort((a, b) => new Date(b.date) - new Date(a.date))
                        
                        if (timeline.length === 0) {
                          return <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No transactions yet</td></tr>
                        }
                        
                        // Calculate running balance
                        let balance = 0
                        const withBalance = [...timeline].reverse().map(t => {
                          if (t.isCancelled) return { ...t, balance: balance }
                          if (t.isDebit) {
                            balance += (t.amount - t.received)
                          } else {
                            balance -= t.amount
                          }
                          return { ...t, balance }
                        }).reverse()
                        
                        return withBalance.map(t => (
                          <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-[13px]">
                              {t.date ? new Date(t.date + ' UTC').toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-5 py-3 text-gray-700 font-medium text-[13px]">
                              {t.invoice && t.invoice !== '—'
                                ? <Link href={`/client/invoice?q=${t.invoice}`} className="hover:underline hover:text-[#008C83]">{t.invoice}</Link>
                                : t.invoice}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${
                                t.isDebit ? 'text-gray-600' : 'text-green-600'
                              }`}>
                                {t.isDebit ? '↑' : '↓'} {t.type}
                              </span>
                              {t.paymentMethod && <span className="text-[10px] text-gray-400 ml-1">({t.paymentMethod})</span>}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className={`font-semibold ${
                                t.isCancelled ? 'text-gray-400 line-through' :
                                t.isDebit ? 'text-red-500' : 'text-green-600'
                              }`}>
                                {t.isDebit ? '' : '+'}₹{t.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                t.status === 'paid' ? 'bg-green-50 text-green-600' :
                                t.status === 'partial' ? 'bg-orange-50 text-orange-600' :
                                t.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                                'bg-red-50 text-red-500'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Debts breakdown */}
              {debts.filter(d => d.status !== 'paid' && d.status !== 'cancelled').length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-800">Pending Debts</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-[12px]">
                          <th className="text-left px-5 py-3 font-medium">Invoice</th>
                          <th className="text-right px-5 py-3 font-medium">Total</th>
                          <th className="text-right px-5 py-3 font-medium">Paid</th>
                          <th className="text-right px-5 py-3 font-medium">Remaining</th>
                          <th className="text-center px-5 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debts.filter(d => d.status !== 'paid' && d.status !== 'cancelled').map(debt => (
                          <tr key={debt.id} className="border-b border-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-700">
                              <Link href={`/client/invoice?q=${debt.invoice_id}`} className="hover:underline hover:text-[#008C83]">{debt.invoice_id}</Link>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-500">₹{(debt.total_amount || 0).toLocaleString()}</td>
                            <td className="px-5 py-3 text-right text-green-600">₹{(debt.paid_amount || 0).toLocaleString()}</td>
                            <td className="px-5 py-3 text-right font-semibold text-red-500">₹{(debt.amount_remaining || 0).toLocaleString()}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                debt.status === 'partial' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-500'
                              }`}>{debt.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Receive Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-800">Receive Payment</h2>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pb-5">
              <div className="text-center py-4 mb-4 rounded-xl bg-[#E6FFFD] border border-[#008C83]/10">
                <p className="text-[12px] text-gray-400 mb-1">Current Due Amount</p>
                <p className="text-3xl font-bold text-[#008C83]">₹{currentDueAmount.toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="₹"
                  min="1"
                  max={currentDueAmount}
                  className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200"
                />
                {paymentAmount && parseFloat(paymentAmount) < currentDueAmount && (
                  <p className="text-[12px] text-gray-400 mt-1.5">Remaining Balance: ₹{(currentDueAmount - parseFloat(paymentAmount)).toLocaleString()}</p>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'upi'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg text-sm font-medium border cursor-pointer duration-150 capitalize ${
                        paymentMethod === m ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >{m}</button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="w-full h-11 rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#00756E] duration-150 cursor-pointer disabled:opacity-50"
              >
                {paymentSubmitting ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Add New Customer</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Name <span className="text-red-500">*</span></label>
                <input className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200" value={customerForm.name} onChange={(e) => setCustomerForm(p => ({ ...p, name: e.target.value }))} placeholder="Customer name" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Phone</label>
                  <input className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200" value={customerForm.phone} onChange={(e) => setCustomerForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                  <input className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200" value={customerForm.email} onChange={(e) => setCustomerForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
                <input className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200" value={customerForm.address} onChange={(e) => setCustomerForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes</label>
                <textarea className="w-full h-16 rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none resize-none focus:border-[#008C83] duration-200" value={customerForm.notes} onChange={(e) => setCustomerForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="h-10 px-5 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 duration-150 cursor-pointer">Cancel</button>
              <button type="button" onClick={handleAddCustomer} disabled={!customerForm.name.trim()} className="h-10 px-5 rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#00756E] duration-150 disabled:opacity-50 cursor-pointer">Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
