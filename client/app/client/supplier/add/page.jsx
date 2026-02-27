'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import api from '@/util/api'

const Add = () => {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    opening_balance: '',
    notes: ''
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return alert('Supplier name is required')
    setSubmitting(true)
    try {
      const res = await api.post('/api/sellers', {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
      })
      if (res.data.success) {
        alert('Supplier added successfully!')
        window.location.href = '/client/supplier'
      } else {
        alert(res.data.message || 'Failed to add supplier')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add supplier')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
      <Link href="/client/supplier" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to suppliers</Link>
      <h1 className='text-3xl font-bold mb-2'>Add supplier</h1>
      <p className='text-sm text-gray-400 mb-10'>Create a new supplier record.</p>
      <div className='w-[80%] mx-auto bg-white p-6 rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>Supplier Information</h2>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <div className='flex gap-6'>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="name" className='text-sm font-light'>Supplier Name *</label>
              <input id="name" value={formData.name} onChange={handleChange} placeholder="ABC Suppliers" required className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="company_name" className='text-sm font-light'>Company Name</label>
              <input id="company_name" value={formData.company_name} onChange={handleChange} placeholder="ABC Corp Pvt Ltd" className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
          </div>
          <div className='flex gap-6'>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="phone" className='text-sm font-light'>Contact number</label>
              <input id="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="email" className='text-sm font-light'>Email</label>
              <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="supplier@example.com" className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
          </div>
          <span className='flex flex-col gap-2 w-full'>
            <label htmlFor="address" className='text-sm font-light'>Address</label>
            <input id="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City" className='px-4 py-2 border border-gray-300 rounded-lg' />
          </span>
          <div className='flex gap-6'>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="gst" className='text-sm font-light'>GST / TaxID</label>
              <input id="gst" value={formData.gst} onChange={handleChange} placeholder="GSTIN1234567890" className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
            <span className='flex flex-col gap-2 w-1/2'>
              <label htmlFor="opening_balance" className='text-sm font-light'>Opening Balance (₹)</label>
              <input id="opening_balance" type="number" min="0" step="0.01" value={formData.opening_balance} onChange={handleChange} placeholder="0.00" className='px-4 py-2 border border-gray-300 rounded-lg' />
            </span>
          </div>
          <span className='flex flex-col gap-2 w-full'>
            <label htmlFor="notes" className='text-sm font-light'>Notes</label>
            <textarea id="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes" rows={4} className='px-4 py-2 border border-gray-300 rounded-lg' />
          </span>
          <hr />
          <div className='w-full flex items-center justify-between gap-4 mt-4'>
            <Link href="/client/supplier" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>Cancel</Link>
            <button type='submit' disabled={submitting} className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200 disabled:opacity-50'>{submitting ? 'Adding...' : 'Add supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Add