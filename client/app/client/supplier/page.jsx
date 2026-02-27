'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { GoPencil } from "react-icons/go"
import { FaRegEye } from "react-icons/fa"
import { MdDeleteOutline } from "react-icons/md"
import api from '@/util/api'

const Supplier = () => {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== '') params.append('is_active', statusFilter)
      const res = await api.get(`/api/sellers?${params.toString()}`)
      if (res.data.success) setSellers(res.data.sellers)
    } catch (err) {
      console.error('Failed to fetch sellers:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellers()
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSellers])

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return
    try {
      const res = await api.delete(`/api/sellers/${id}`)
      if (res.data.success) fetchSellers()
      else alert(res.data.message || 'Failed to delete')
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete seller with pending payments')
    }
  }

  const paginatedData = sellers.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalPages = Math.ceil(sellers.length / perPage)

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

  const totalOutstanding = sellers.reduce((sum, s) => sum + (s.total_pending || 0), 0)
  const activeCount = sellers.filter(s => s.is_active === 1).length

  return (
    <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
      <span className='w-full flex items-center justify-between gap-4 mb-10'>
        <h2 className='font-semibold text-4xl'>Suppliers <p className='text-sm text-gray-400 font-normal mt-2'>Manage supplier information and relationships</p></h2>
        <span className='gap-2 flex'>
          <Link href="/client/supplier/add" className='bg-[#008C83] px-5 hover:bg-[#00675B] text-white py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><IoMdAdd /> Add Supplier</Link>
        </span>
      </span>

      <div className='w-full mx-auto rounded-lg mb-10 flex gap-6 items-center justify-center'>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Total Suppliers</p>
          <p className='text-3xl font-bold'>{sellers.length}</p>
        </div>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Active Suppliers</p>
          <p className='text-3xl font-bold text-green-500'>{activeCount}</p>
        </div>
        <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
          <p>Total Outstanding</p>
          <p className='text-3xl font-bold text-red-500'>₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className='w-full h-20 bg-white rounded-lg flex items-center justify-between px-8'>
        <span className='p-4 border border-gray-200 rounded-xl flex items-center justify-center w-[70%]'>
          <CiSearch />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company or phone"
            className='ml-2 w-full h-full border-none outline-none'
          />
        </span>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='ml-4 p-3 rounded-lg border border-gray-300'
          >
            <option value="">All Suppliers</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>

      <div className='w-full mx-auto rounded-lg bg-white mt-10 overflow-x-auto'>
        {loading ? (
          <div className='p-20 text-center text-gray-400'>Loading suppliers...</div>
        ) : sellers.length === 0 ? (
          <div className='p-20 text-center text-gray-400'>No suppliers found</div>
        ) : (
          <>
            <table className='w-full table-auto'>
              <thead>
                <tr className='text-left bg-gray-100'>
                  <th className='p-4'>Supplier Name</th>
                  <th className='p-4'>Company</th>
                  <th className='p-4'>Contact</th>
                  <th className='p-4'>Total Purchases</th>
                  <th className='p-4'>Outstanding</th>
                  <th className='p-4'>Status</th>
                  <th className='p-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className='border-t hover:bg-gray-50'>
                    <td className='p-6 text-sm font-medium'>{item.name}</td>
                    <td className='p-6 text-sm text-gray-500'>{item.company_name || '—'}</td>
                    <td className='p-6 text-sm'>{item.phone || '—'}</td>
                    <td className='p-6 text-sm'>₹{(item.total_purchase_amount || 0).toLocaleString('en-IN')}</td>
                    <td className={`p-6 text-sm font-semibold ${(item.total_pending || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{(item.total_pending || 0).toLocaleString('en-IN')}
                    </td>
                    <td className={`p-6 text-sm font-semibold ${item.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </td>
                    <td className='p-6 text-sm flex items-center justify-center gap-4'>
                      <Link href={`/client/supplier/${item.id}/view`} className='text-green-500 hover:underline text-lg'><FaRegEye /></Link>
                      <Link href={`/client/supplier/${item.id}/edit`} className='text-gray-500 hover:underline text-lg'><GoPencil /></Link>
                      <button onClick={() => handleDelete(item.id, item.name)} className='text-red-400 hover:text-red-600 text-lg cursor-pointer'><MdDeleteOutline /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
              <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {sellers.length} items</p>
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

export default Supplier