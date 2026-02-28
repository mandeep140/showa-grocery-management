'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { FaRegEye } from "react-icons/fa"
import { MdDeleteOutline } from "react-icons/md"
import { IoChevronDown } from "react-icons/io5"
import { FiCalendar } from "react-icons/fi"
import api from '@/util/api'

const Purchase = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchSeller, setSearchSeller] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const [datePreset, setDatePreset] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const paymentDropdownRef = React.useRef(null)
  const perPage = 10

  const getDateRange = (preset) => {
    const today = new Date()
    const fmt = (d) => d.toISOString().split('T')[0]
    switch (preset) {
      case 'today': return { start_date: fmt(today), end_date: fmt(today) }
      case '7days': { const d = new Date(today); d.setDate(d.getDate() - 7); return { start_date: fmt(d), end_date: fmt(today) } }
      case '30days': { const d = new Date(today); d.setDate(d.getDate() - 30); return { start_date: fmt(d), end_date: fmt(today) } }
      case '90days': { const d = new Date(today); d.setDate(d.getDate() - 90); return { start_date: fmt(d), end_date: fmt(today) } }
      case 'custom': return { start_date: customStart, end_date: customEnd }
      default: return {}
    }
  }

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (paymentFilter) params.append('payment_status', paymentFilter)
      const range = getDateRange(datePreset)
      if (range.start_date) params.append('start_date', range.start_date)
      if (range.end_date) params.append('end_date', range.end_date)
      const res = await api.get(`/api/purchases?${params.toString()}`)
      if (res.data.success) setPurchases(res.data.purchases)
    } catch (err) {
      console.error('Failed to fetch purchases:', err)
    } finally {
      setLoading(false)
    }
  }, [paymentFilter, datePreset, customStart, customEnd])

  useEffect(() => {
    fetchPurchases()
    setCurrentPage(1)
  }, [fetchPurchases])

  useEffect(() => {
    const handleOutside = (event) => {
      if (!paymentDropdownRef.current) return
      if (!paymentDropdownRef.current.contains(event.target)) setPaymentDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleDelete = async (id, invoice) => {
    if (!confirm(`Delete purchase "${invoice}"? This will remove all related batches and stock entries.`)) return
    try {
      const res = await api.delete(`/api/purchases/${id}`)
      if (res.data.success) fetchPurchases()
      else alert(res.data.message || 'Failed to delete')
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete this purchase')
    }
  }

  const filtered = searchSeller
    ? purchases.filter(
        (p) =>
          (p.seller_name || '').toLowerCase().includes(searchSeller.toLowerCase()) ||
          (p.invoice_number || '').toLowerCase().includes(searchSeller.toLowerCase())
      )
    : purchases

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      if (currentPage - 1 > 1 && currentPage - 1 < totalPages) pages.push(currentPage - 1)
      if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage)
      if (currentPage + 1 < totalPages && currentPage + 1 > 1) pages.push(currentPage + 1)
      if (currentPage < totalPages - 2) pages.push('...')
      if (totalPages > 1) pages.push(totalPages)
    }
    return pages
  }

  const totalAmount = filtered.reduce((sum, p) => sum + (p.final_amount || 0), 0)
  const totalPaid = filtered.reduce((sum, p) => sum + (p.paid_amount || 0), 0)
  const totalPending = totalAmount - totalPaid
  const selectedPaymentLabel =
    paymentFilter === 'paid'
      ? 'Paid'
      : paymentFilter === 'partial'
        ? 'Partial'
        : paymentFilter === 'pending'
          ? 'Pending'
          : 'All Status'

  return (
    <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
      <div className='mb-6 flex w-full flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h2 className='text-3xl font-semibold sm:text-4xl'>Purchases</h2>
          <p className='mt-2 text-sm font-normal text-gray-400'>Manage purchase orders and payments</p>
        </div>
        <div className='flex w-full gap-2 sm:w-auto'>
          <Link
            href='/client/purchase/add'
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#008C83] px-4 py-2 text-white duration-200 hover:bg-[#00675B] sm:w-auto sm:px-5'
          >
            <IoMdAdd /> New Purchase Order
          </Link>
        </div>
      </div>

      <div className='mb-8 grid w-full grid-cols-1 gap-4 sm:mb-10 md:grid-cols-3 md:gap-6'>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Total Orders</p>
          <p className='text-3xl font-bold'>{filtered.length}</p>
        </div>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Total Amount</p>
          <p className='text-3xl font-bold text-green-500'>Rs. {totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Pending Payment</p>
          <p className='text-3xl font-bold text-red-500'>Rs. {totalPending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className='mb-6 rounded-lg bg-white p-4 sm:p-5'>
        <p className='flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3'>
          <FiCalendar className='h-3.5 w-3.5 text-[#008C83]' /> Date Range
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          {[
            { key: '', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: '30days', label: 'Last 30 Days' },
            { key: '90days', label: 'Last 90 Days' },
            { key: 'custom', label: 'Custom' },
          ].map(b => (
            <button
              key={b.key}
              type='button'
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
            <div className='ml-0 flex w-full flex-col items-stretch gap-2 sm:ml-2 sm:w-auto sm:flex-row sm:items-center'>
              <input
                type='date'
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className='h-8 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-[#008C83]'
              />
              <span className='hidden text-xs text-gray-400 sm:inline'>to</span>
              <input
                type='date'
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className='h-8 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-[#008C83]'
              />
            </div>
          )}
        </div>
      </div>

      <div className='flex w-full flex-col gap-4 rounded-lg bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between'>
        <span className='flex w-full items-center justify-center rounded-xl border border-gray-200 p-3 sm:p-4 lg:max-w-[70%]'>
          <CiSearch />
          <input
            type='text'
            value={searchSeller}
            onChange={(e) => {
              setSearchSeller(e.target.value)
              setCurrentPage(1)
            }}
            placeholder='Search by supplier name or invoice number'
            className='ml-2 h-full w-full border-none outline-none'
          />
        </span>
        <div ref={paymentDropdownRef} className='w-full lg:w-auto'>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setPaymentDropdownOpen((prev) => !prev)}
              className='flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-left lg:ml-4 lg:min-w-[180px]'
            >
              <span>{selectedPaymentLabel}</span>
              <IoChevronDown className='text-sm text-gray-500' />
            </button>
            {paymentDropdownOpen && (
              <div className='absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg'>
                <button
                  type='button'
                  onClick={() => {
                    setPaymentFilter('')
                    setPaymentDropdownOpen(false)
                  }}
                  className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  All Status
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setPaymentFilter('paid')
                    setPaymentDropdownOpen(false)
                  }}
                  className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  Paid
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setPaymentFilter('partial')
                    setPaymentDropdownOpen(false)
                  }}
                  className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  Partial
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setPaymentFilter('pending')
                    setPaymentDropdownOpen(false)
                  }}
                  className='w-full px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  Pending
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='mx-auto mt-8 w-full overflow-x-auto rounded-lg bg-white sm:mt-10'>
        {loading ? (
          <div className='p-20 text-center text-gray-400'>Loading purchases...</div>
        ) : filtered.length === 0 ? (
          <div className='p-20 text-center text-gray-400'>No purchase orders found</div>
        ) : (
          <>
            <table className='min-w-[920px] w-full table-auto'>
              <thead>
                <tr className='bg-gray-100 text-left'>
                  <th className='p-4'>Invoice</th>
                  <th className='p-4'>Supplier</th>
                  <th className='p-4'>Date</th>
                  <th className='p-4'>Location</th>
                  <th className='p-4'>Amount</th>
                  <th className='p-4'>Paid</th>
                  <th className='p-4'>Status</th>
                  <th className='p-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className='border-t hover:bg-gray-50'>
                    <td className='p-4 text-sm font-medium sm:p-6'>{item.invoice_number}</td>
                    <td className='p-4 text-sm sm:p-6'>
                      {item.seller_name || '-'}
                      {item.company_name ? <span className='ml-1 text-xs text-gray-400'>({item.company_name})</span> : ''}
                    </td>
                    <td className='p-4 text-sm text-gray-500 sm:p-6'>{new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td className='p-4 text-sm text-gray-500 sm:p-6'>{item.location_name || '-'}</td>
                    <td className='p-4 text-sm font-medium sm:p-6'>Rs. {(item.final_amount || 0).toLocaleString('en-IN')}</td>
                    <td className='p-4 text-sm sm:p-6'>Rs. {(item.paid_amount || 0).toLocaleString('en-IN')}</td>
                    <td className='p-4 sm:p-6'>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          item.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : item.payment_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.payment_status}
                      </span>
                    </td>
                    <td className='flex items-center justify-center gap-4 p-4 text-sm sm:p-6'>
                      <Link href={`/client/purchase/${item.id}/view`} className='text-lg text-green-500 hover:underline'>
                        <FaRegEye />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.invoice_number)}
                        className='cursor-pointer text-lg text-red-400 hover:text-red-600'
                      >
                        <MdDeleteOutline />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='flex flex-col gap-4 rounded-b-lg bg-[#FAFAFA] px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-7'>
              <p className='text-sm font-light tracking-wide sm:text-base'>
                showing {paginatedData.length} of {filtered.length} items
              </p>
              <div className='flex flex-wrap items-center gap-2 sm:justify-center sm:gap-4'>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className='rounded-lg border border-gray-300 bg-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4'
                >
                  Previous
                </button>

                <div className='flex flex-wrap items-center'>
                  {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className='px-3 py-2 sm:px-4'>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`mx-1 rounded-lg px-3 py-2 sm:px-4 ${currentPage === page ? 'bg-[#008C83] text-white' : 'bg-gray-300'}`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className='rounded-lg border border-gray-300 bg-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4'
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Purchase
