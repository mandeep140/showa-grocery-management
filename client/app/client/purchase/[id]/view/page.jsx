'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { useParams } from 'next/navigation'
import { FaRupeeSign } from "react-icons/fa"
import { GoPencil } from "react-icons/go"
import api from '@/util/api'

const ViewPurchase = () => {
  const params = useParams()
  const { id } = params
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await api.get(`/api/purchases/${id}`)
        if (res.data.success) setPurchase(res.data.purchase)
      } catch (err) {
        console.error('Failed to fetch purchase:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPurchase()
  }, [id])

  if (loading) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Loading...</div>
  if (!purchase) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Purchase not found</div>

  const items = purchase.items || []
  const due = (purchase.final_amount || 0) - (purchase.paid_amount || 0)

  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
      <Link href="/client/purchase" className='flex items-center mb-8 hover:text-gray-500 duration-200'><IoMdArrowBack /> &nbsp; Back to purchases</Link>

      <div className='flex items-center justify-between mb-10'>
        <div>
          <h1 className='text-3xl font-bold'>Purchase Order</h1>
          <p className='text-sm text-gray-400 mt-1'>{purchase.invoice_number}</p>
        </div>
        <div className='flex gap-3'>
          <Link href={`/client/purchase/${id}/edit`} className='px-5 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 duration-200 flex items-center gap-2'>
            <GoPencil /> Edit
          </Link>
        </div>
      </div>

      <div className='flex gap-6 items-start'>
        <div className='flex-1 flex flex-col gap-6'>
          <div className='bg-white rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-6'>Order Details</h2>
            <div className='grid grid-cols-2 gap-y-5 gap-x-8'>
              <div>
                <p className='text-sm text-gray-400'>Invoice Number</p>
                <p className='font-medium'>{purchase.invoice_number}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Purchase Date</p>
                <p className='font-medium'>{new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Supplier</p>
                <Link href={`/client/supplier/${purchase.seller_id}/view`} className='font-medium text-[#008C83] hover:underline'>
                  {purchase.seller_name}{purchase.company_name ? ` (${purchase.company_name})` : ''}
                </Link>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Location</p>
                <p className='font-medium'>{purchase.location_name || '—'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Created By</p>
                <p className='font-medium'>{purchase.created_by_name || '—'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Payment Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-700' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {purchase.payment_status}
                </span>
              </div>
            </div>
            {purchase.notes && (
              <>
                <hr className='my-5' />
                <p className='text-sm text-gray-400 mb-1'>Notes</p>
                <p className='text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg'>{purchase.notes}</p>
              </>
            )}
          </div>

          <div className='bg-white rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-6'>Items ({items.length})</h2>
            {items.length === 0 ? (
              <p className='text-gray-400 text-center py-10'>No items</p>
            ) : (
              <table className='w-full text-left'>
                <thead>
                  <tr className='border-b bg-gray-50'>
                    <th className='p-3 text-sm text-gray-500'>Product</th>
                    <th className='p-3 text-sm text-gray-500'>Batch</th>
                    <th className='p-3 text-sm text-gray-500'>Expiry</th>
                    <th className='p-3 text-sm text-gray-500'>Qty</th>
                    <th className='p-3 text-sm text-gray-500'>Rate</th>
                    <th className='p-3 text-sm text-gray-500'>Tax %</th>
                    <th className='p-3 text-sm text-gray-500 text-right'>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const subtotal = item.quantity * item.buying_rate
                    const tax = subtotal * (item.tax_percent || 0) / 100
                    return (
                      <tr key={index} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='p-3 text-sm'>
                          <p className='font-medium'>{item.product_name}</p>
                          <p className='text-xs text-gray-400'>{item.product_code}</p>
                        </td>
                        <td className='p-3 text-sm text-gray-500'>{item.batch_no || '—'}</td>
                        <td className='p-3 text-sm text-gray-500'>{item.expire_date ? new Date(item.expire_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className='p-3 text-sm'>{item.quantity}</td>
                        <td className='p-3 text-sm'>₹{(item.buying_rate || 0).toLocaleString('en-IN')}</td>
                        <td className='p-3 text-sm'>{item.tax_percent || 0}%</td>
                        <td className='p-3 text-sm text-right font-medium'>₹{(subtotal + tax).toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className='w-[300px] flex flex-col gap-6 sticky top-24'>
          <div className='bg-white rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-5'>Payment Summary</h2>
            <div className='flex flex-col gap-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Subtotal</span>
                <span>₹{(purchase.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Tax</span>
                <span>₹{(purchase.tax_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Discount</span>
                <span className='text-red-500'>-₹{(purchase.discount_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='w-full h-px bg-gray-200 my-1'></div>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-base'>Grand Total</span>
                <span className='font-bold text-xl text-[#008C83]'>₹{(purchase.final_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='w-full h-px bg-gray-200 my-1'></div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Paid</span>
                <span className='text-green-600 font-medium'>₹{(purchase.paid_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Due</span>
                <span className={`font-semibold ${due > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{Math.max(0, due).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <Link href={`/client/supplier/${purchase.seller_id}/view`} className='bg-white rounded-xl p-5 hover:bg-[#E6FFFD] duration-200 border border-transparent hover:border-[#008C83]'>
            <p className='text-xs text-gray-400 mb-1'>Supplier</p>
            <p className='font-semibold text-[#008C83]'>{purchase.seller_name}</p>
            {purchase.company_name && <p className='text-xs text-gray-400 mt-0.5'>{purchase.company_name}</p>}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ViewPurchase
