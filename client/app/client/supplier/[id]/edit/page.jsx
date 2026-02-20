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
    is_active: 1
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
            is_active: s.is_active
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
    setFormData(prev => ({ ...prev, [e.target.id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return alert('Supplier name is required')
    setSubmitting(true)
    try {
      const res = await api.put(`/api/sellers/${id}`, {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
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

  if (loading) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Loading...</div>

  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
      <Link href={`/client/supplier/${id}/view`} className='flex items-center mb-8 hover:text-gray-500 duration-200'><IoMdArrowBack /> &nbsp; Back to supplier</Link>
      <h1 className='text-3xl font-bold mb-2'>Edit supplier</h1>
      <p className='text-sm text-gray-400 mb-10'>Edit supplier record.</p>
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
          <div className='flex items-center gap-3'>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="is_active" className="sr-only peer" checked={formData.is_active === 1} onChange={handleChange} />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008C83]"></div>
            </label>
            <span className='text-sm text-gray-600'>Active</span>
          </div>
          <hr />
          <div className='w-full flex items-center justify-between gap-4 mt-4'>
            <Link href={`/client/supplier/${id}/view`} className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>Cancel</Link>
            <button type='submit' disabled={submitting} className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200 disabled:opacity-50'>{submitting ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Edit