'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { useParams } from 'next/navigation'
import api from '@/util/api'

const EditPurchase = () => {
  const params = useParams()
  const { id } = params
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    discount_amount: '',
    paid_amount: '',
    notes: ''
  })

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await api.get(`/api/purchases/${id}`)
        if (res.data.success) {
          const p = res.data.purchase
          setPurchase(p)
          setFormData({
            discount_amount: p.discount_amount || 0,
            paid_amount: p.paid_amount || 0,
            notes: p.notes || ''
          })
        }
      } catch (err) {
        console.error('Failed to fetch purchase:', err)
        alert('Failed to load purchase')
      } finally {
        setLoading(false)
      }
    }
    fetchPurchase()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.put(`/api/purchases/${id}`, {
        discount_amount: parseFloat(formData.discount_amount) || 0,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        notes: formData.notes || null
      })
      if (res.data.success) {
        alert('Purchase updated!')
        window.location.href = `/client/purchase/${id}/view`
      } else {
        alert(res.data.message || 'Update failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Loading...</div>
  if (!purchase) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Purchase not found</div>

  const subtotal = purchase.total_amount || 0
  const taxAmount = purchase.tax_amount || 0
  const discount = parseFloat(formData.discount_amount) || 0
  const finalAmount = subtotal + taxAmount - discount
  const paid = parseFloat(formData.paid_amount) || 0
  const due = finalAmount - paid

  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
      <Link href={`/client/purchase/${id}/view`} className='flex items-center mb-8 hover:text-gray-500 duration-200'><IoMdArrowBack /> &nbsp; Back to purchase</Link>

      <h1 className='text-3xl font-bold mb-2'>Edit Purchase</h1>
      <p className='text-sm text-gray-400 mb-10'>Update payment and discount for <span className='font-medium text-gray-600'>{purchase.invoice_number}</span></p>

      <div className='flex gap-6 items-start w-[80%] mx-auto'>
        <div className='flex-1'>
          <div className='bg-white rounded-xl p-6 mb-6'>
            <h2 className='text-lg font-bold mb-4'>Order Info (Read Only)</h2>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-gray-400'>Invoice</p>
                <p className='font-medium'>{purchase.invoice_number}</p>
              </div>
              <div>
                <p className='text-gray-400'>Date</p>
                <p className='font-medium'>{new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className='text-gray-400'>Supplier</p>
                <p className='font-medium'>{purchase.seller_name}</p>
              </div>
              <div>
                <p className='text-gray-400'>Location</p>
                <p className='font-medium'>{purchase.location_name || '—'}</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 mb-6'>
            <h2 className='text-lg font-bold mb-4'>Items ({(purchase.items || []).length})</h2>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b bg-gray-50'>
                  <th className='p-3 text-gray-500'>Product</th>
                  <th className='p-3 text-gray-500'>Qty</th>
                  <th className='p-3 text-gray-500'>Rate</th>
                  <th className='p-3 text-gray-500 text-right'>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(purchase.items || []).map((item, i) => (
                  <tr key={i} className='border-b border-gray-100'>
                    <td className='p-3 font-medium'>{item.product_name}</td>
                    <td className='p-3'>{item.quantity}</td>
                    <td className='p-3'>₹{(item.buying_rate || 0).toLocaleString('en-IN')}</td>
                    <td className='p-3 text-right'>₹{(item.subtotal || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleSubmit} className='bg-white rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-6'>Payment Details</h2>
            <div className='flex flex-col gap-5'>
              <div className='flex gap-6'>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm text-gray-500'>Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                    className='px-4 py-2 border border-gray-300 rounded-lg'
                  />
                </div>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm text-gray-500'>Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    className='px-4 py-2 border border-gray-300 rounded-lg'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes..."
                  rows={3}
                  className='px-4 py-2 border border-gray-300 rounded-lg resize-none'
                />
              </div>
              <hr />
              <div className='flex items-center justify-between mt-2'>
                <Link href={`/client/purchase/${id}/view`} className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>Cancel</Link>
                <button type='submit' disabled={submitting} className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200 disabled:opacity-50'>{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </form>
        </div>

        <div className='w-[280px] sticky top-24'>
          <div className='bg-white rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-5'>Summary</h2>
            <div className='flex flex-col gap-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Tax</span>
                <span>₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Discount</span>
                <span className='text-red-500'>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
              <div className='w-full h-px bg-gray-200 my-1'></div>
              <div className='flex justify-between'>
                <span className='font-bold'>Total</span>
                <span className='font-bold text-lg text-[#008C83]'>₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className='w-full h-px bg-gray-200 my-1'></div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Paid</span>
                <span className='text-green-600'>₹{paid.toLocaleString('en-IN')}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Due</span>
                <span className={`font-semibold ${due > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{Math.max(0, due).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPurchase
