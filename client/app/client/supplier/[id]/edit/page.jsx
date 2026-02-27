'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { useParams } from 'next/navigation'
import api from '@/util/api'

const Edit = () => {
  const params = useParams()
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    opening_balance: '',
    notes: '',
    is_active: 1,
  })

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await api.get(`/api/sellers/${id}`)
        if (res.data.success) {
          const s = res.data.seller
          setFormData({
            name: s.name || '',
            company_name: s.company_name || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            gst: s.gst || '',
            opening_balance: s.opening_balance || '',
            notes: s.notes || '',
            is_active: s.is_active,
          })
        }
      } catch (err) {
        console.error('Failed to fetch seller:', err)
        alert('Failed to load supplier data')
      } finally {
        setLoading(false)
      }
    }
    fetchSeller()
  }, [id])

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value
    setFormData((prev) => ({ ...prev, [e.target.id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return alert('Supplier name is required')
    setSubmitting(true)
    try {
      const res = await api.put(`/api/sellers/${id}`, {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0,
      })
      if (res.data.success) {
        alert('Supplier updated successfully!')
        window.location.href = `/client/supplier/${id}/view`
      } else {
        alert(res.data.message || 'Failed to update supplier')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update supplier')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 text-gray-400 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>Loading...</div>
  }

  return (
    <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
      <Link href={`/client/supplier/${id}/view`} className='mb-4 flex items-center duration-200 hover:text-gray-500'>
        <IoMdArrowBack /> &nbsp; Back to supplier
      </Link>
      <h1 className='mb-2 text-2xl font-bold sm:text-3xl'>Edit supplier</h1>
      <p className='mb-8 text-sm text-gray-400 sm:mb-10'>Edit supplier record.</p>

      <div className='mx-auto w-full rounded-lg bg-white p-4 sm:p-6 lg:max-w-5xl'>
        <h2 className='mb-4 text-xl font-semibold'>Supplier Information</h2>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6'>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='name' className='text-sm font-light'>Supplier Name *</label>
              <input id='name' value={formData.name} onChange={handleChange} placeholder='ABC Suppliers' required className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='company_name' className='text-sm font-light'>Company Name</label>
              <input id='company_name' value={formData.company_name} onChange={handleChange} placeholder='ABC Corp Pvt Ltd' className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='phone' className='text-sm font-light'>Contact number</label>
              <input id='phone' value={formData.phone} onChange={handleChange} placeholder='9876543210' className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='email' className='text-sm font-light'>Email</label>
              <input id='email' type='email' value={formData.email} onChange={handleChange} placeholder='supplier@example.com' className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
          </div>

          <span className='flex w-full flex-col gap-2'>
            <label htmlFor='address' className='text-sm font-light'>Address</label>
            <input id='address' value={formData.address} onChange={handleChange} placeholder='123 Main St, City' className='rounded-lg border border-gray-300 px-4 py-2' />
          </span>

          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6'>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='gst' className='text-sm font-light'>GST / TaxID</label>
              <input id='gst' value={formData.gst} onChange={handleChange} placeholder='GSTIN1234567890' className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
            <span className='flex w-full flex-col gap-2'>
              <label htmlFor='opening_balance' className='text-sm font-light'>Opening Balance (Rs.)</label>
              <input id='opening_balance' type='number' min='0' step='0.01' value={formData.opening_balance} onChange={handleChange} placeholder='0.00' className='rounded-lg border border-gray-300 px-4 py-2' />
            </span>
          </div>

          <span className='flex w-full flex-col gap-2'>
            <label htmlFor='notes' className='text-sm font-light'>Notes</label>
            <textarea id='notes' value={formData.notes} onChange={handleChange} placeholder='Additional notes' rows={4} className='rounded-lg border border-gray-300 px-4 py-2' />
          </span>

          <div className='flex items-center gap-3'>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input type='checkbox' id='is_active' className='peer sr-only' checked={formData.is_active === 1} onChange={handleChange} />
              <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-[#008C83] peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
            </label>
            <span className='text-sm text-gray-600'>Active</span>
          </div>

          <hr />

          <div className='mt-2 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-4 md:w-auto md:max-w-[360px] md:ml-auto'>
            <Link href={`/client/supplier/${id}/view`} className='flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-semibold duration-150 hover:bg-gray-100'>
              Cancel
            </Link>
            <button type='submit' disabled={submitting} className='flex h-11 items-center justify-center rounded-lg bg-[#008C83] px-4 text-sm font-semibold text-white duration-200 hover:bg-[#007571] disabled:opacity-50'>
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Edit
