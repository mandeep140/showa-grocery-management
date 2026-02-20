'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { FaRegEye } from "react-icons/fa"
import { MdDeleteOutline } from "react-icons/md"
import api from '@/util/api'

const Purchase = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchSeller, setSearchSeller] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (paymentFilter) params.append('payment_status', paymentFilter)
      const res = await api.get(`/api/purchases?${params.toString()}`)
      if (res.data.success) setPurchases(res.data.purchases)
    } catch (err) {
      console.error('Failed to fetch purchases:', err)
    } finally {
      setLoading(false)
    }
  }, [paymentFilter])

  useEffect(() => {
    fetchPurchases()
    setCurrentPage(1)
  }, [fetchPurchases])

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
    ? purchases.filter(p => (p.seller_name || '').toLowerCase().includes(searchSeller.toLowerCase()) || (p.invoice_number || '').toLowerCase().includes(searchSeller.toLowerCase()))
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

  return (
    <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
      <span className='w-full flex items-center justify-between gap-4 mb-10'>
        <h2 className='font-semibold text-4xl'>Purchases <p className='text-sm text-gray-400 font-normal mt-2'>Manage purchase orders and payments</p></h2>
        <span className='gap-2 flex'>
          <Link href="/client/purchase/add" className='bg-[#008C83] px-5 hover:bg-[#00675B] text-white py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><IoMdAdd /> New Purchase Order</Link>
        </span>
      </span>

      <div className='w-full mx-auto rounded-lg mb-10 flex gap-6 items-center justify-center'>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Total Orders</p>
          <p className='text-3xl font-bold'>{filtered.length}</p>
        </div>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Total Amount</p>
          <p className='text-3xl font-bold text-green-500'>₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Pending Payment</p>
          <p className='text-3xl font-bold text-red-500'>₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className='w-full h-20 bg-white rounded-lg flex items-center justify-between px-8'>
        <span className='p-4 border border-gray-200 rounded-xl flex items-center justify-center w-[70%]'>
          <CiSearch />
          <input
            type="text"
            value={searchSeller}
            onChange={(e) => { setSearchSeller(e.target.value); setCurrentPage(1) }}
            placeholder="Search by supplier name or invoice number"
            className='ml-2 w-full h-full border-none outline-none'
          />
        </span>
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className='ml-4 p-3 rounded-lg border border-gray-300'
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className='w-full mx-auto rounded-lg bg-white mt-10 overflow-x-auto'>
        {loading ? (
          <div className='p-20 text-center text-gray-400'>Loading purchases...</div>
        ) : filtered.length === 0 ? (
          <div className='p-20 text-center text-gray-400'>No purchase orders found</div>
        ) : (
          <>
            <table className='w-full table-auto'>
              <thead>
                <tr className='text-left bg-gray-100'>
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
                    <td className='p-6 text-sm font-medium'>{item.invoice_number}</td>
                    <td className='p-6 text-sm'>{item.seller_name || '—'}{item.company_name ? <span className='text-gray-400 text-xs ml-1'>({item.company_name})</span> : ''}</td>
                    <td className='p-6 text-sm text-gray-500'>{new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td className='p-6 text-sm text-gray-500'>{item.location_name || '—'}</td>
                    <td className='p-6 text-sm font-medium'>₹{(item.final_amount || 0).toLocaleString('en-IN')}</td>
                    <td className='p-6 text-sm'>₹{(item.paid_amount || 0).toLocaleString('en-IN')}</td>
                    <td className='p-6'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.payment_status === 'paid' ? 'bg-green-100 text-green-700' : item.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {item.payment_status}
                      </span>
                    </td>
                    <td className='p-6 text-sm flex items-center justify-center gap-4'>
                      <Link href={`/client/purchase/${item.id}/view`} className='text-green-500 hover:underline text-lg'><FaRegEye /></Link>
                      <button onClick={() => handleDelete(item.id, item.invoice_number)} className='text-red-400 hover:text-red-600 text-lg cursor-pointer'><MdDeleteOutline /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
              <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {filtered.length} items</p>
              <div className='flex justify-center items-center gap-4'>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                >
                  Previous
                </button>
                <div>
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-4 py-2 mx-1">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 mx-1 rounded-lg ${currentPage === page ? 'bg-[#008C83] text-white' : 'bg-gray-300'}`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
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