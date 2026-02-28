'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { GoPencil } from "react-icons/go"
import { FaRegEye } from "react-icons/fa"
import { MdDeleteOutline } from "react-icons/md"
import { IoChevronDown } from "react-icons/io5"
import api from '@/util/api'

const Supplier = () => {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef(null)
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

  useEffect(() => {
    const handleOutside = (event) => {
      if (!statusDropdownRef.current) return
      if (!statusDropdownRef.current.contains(event.target)) setStatusDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

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
  const activeCount = sellers.filter((s) => s.is_active === 1).length
  const selectedStatusLabel = statusFilter === '1' ? 'Active' : statusFilter === '0' ? 'Inactive' : 'All Suppliers'

  return (
    <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
      <div className='mb-6 flex w-full flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h2 className='text-3xl font-semibold sm:text-4xl'>Suppliers</h2>
          <p className='mt-2 text-sm font-normal text-gray-400'>Manage supplier information and relationships</p>
        </div>
        <div className='flex w-full gap-2 sm:w-auto'>
          <Link href='/client/supplier/add' className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#008C83] px-4 py-2 text-white duration-200 hover:bg-[#00675B] sm:w-auto sm:px-5'>
            <IoMdAdd /> Add Supplier
          </Link>
        </div>
      </div>

      <div className='mb-8 grid w-full grid-cols-1 gap-4 sm:mb-10 md:grid-cols-3 md:gap-6'>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Total Suppliers</p>
          <p className='text-3xl font-bold'>{sellers.length}</p>
        </div>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Active Suppliers</p>
          <p className='text-3xl font-bold text-green-500'>{activeCount}</p>
        </div>
        <div className='flex flex-col items-start gap-4 rounded-lg bg-white p-5'>
          <p>Total Outstanding</p>
          <p className='text-3xl font-bold text-red-500'>Rs. {totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className='flex w-full flex-col gap-4 rounded-lg bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between'>
        <span className='flex w-full items-center justify-center rounded-xl border border-gray-200 p-3 sm:p-4 lg:max-w-[70%]'>
          <CiSearch />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by name, company or phone'
            className='ml-2 h-full w-full border-none outline-none'
          />
        </span>

        <div ref={statusDropdownRef} className='w-full lg:w-auto'>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setStatusDropdownOpen((prev) => !prev)}
              className='flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-left lg:min-w-[180px]'
            >
              <span>{selectedStatusLabel}</span>
              <IoChevronDown className='text-sm text-gray-500' />
            </button>
            {statusDropdownOpen && (
              <div className='absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg'>
                <button
                  type='button'
                  onClick={() => {
                    setStatusFilter('')
                    setStatusDropdownOpen(false)
                  }}
                  className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  All Suppliers
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setStatusFilter('1')
                    setStatusDropdownOpen(false)
                  }}
                  className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  Active
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setStatusFilter('0')
                    setStatusDropdownOpen(false)
                  }}
                  className='w-full px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                >
                  Inactive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='mx-auto mt-8 w-full overflow-x-auto rounded-lg bg-white sm:mt-10'>
        {loading ? (
          <div className='p-20 text-center text-gray-400'>Loading suppliers...</div>
        ) : sellers.length === 0 ? (
          <div className='p-20 text-center text-gray-400'>No suppliers found</div>
        ) : (
          <>
            <table className='min-w-[920px] w-full table-auto'>
              <thead>
                <tr className='bg-gray-100 text-left'>
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
                    <td className='p-4 text-sm font-medium sm:p-6'>{item.name}</td>
                    <td className='p-4 text-sm text-gray-500 sm:p-6'>{item.company_name || '-'}</td>
                    <td className='p-4 text-sm sm:p-6'>{item.phone || '-'}</td>
                    <td className='p-4 text-sm sm:p-6'>Rs. {(item.total_purchase_amount || 0).toLocaleString('en-IN')}</td>
                    <td className={`p-4 text-sm font-semibold sm:p-6 ${(item.total_pending || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      Rs. {(item.total_pending || 0).toLocaleString('en-IN')}
                    </td>
                    <td className={`p-4 text-sm font-semibold sm:p-6 ${item.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </td>
                    <td className='flex items-center justify-center gap-4 p-4 text-sm sm:p-6'>
                      <Link href={`/client/supplier/${item.id}/view`} className='text-lg text-green-500 hover:underline'><FaRegEye /></Link>
                      <Link href={`/client/supplier/${item.id}/edit`} className='text-lg text-gray-500 hover:underline'><GoPencil /></Link>
                      <button onClick={() => handleDelete(item.id, item.name)} className='cursor-pointer text-lg text-red-400 hover:text-red-600'><MdDeleteOutline /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='flex flex-col gap-4 rounded-b-lg bg-[#FAFAFA] px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-7'>
              <p className='text-sm font-light tracking-wide sm:text-base'>showing {paginatedData.length} of {sellers.length} items</p>
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
                      <span key={`ellipsis-${index}`} className='px-3 py-2 sm:px-4'>...</span>
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

export default Supplier
