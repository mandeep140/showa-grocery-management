'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { useParams } from 'next/navigation'
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

  if (loading) {
    return <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 text-gray-400 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-24'>Loading...</div>
  }

  if (!purchase) {
    return <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 text-gray-400 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-24'>Purchase not found</div>
  }

  const items = purchase.items || []
  const due = (purchase.final_amount || 0) - (purchase.paid_amount || 0)

  return (
    <div className='min-h-screen w-full bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-24'>
      <Link href='/client/purchase' className='mb-4 flex items-center duration-200 hover:text-gray-500'>
        <IoMdArrowBack /> &nbsp; Back to purchases
      </Link>

      <div className='mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold sm:text-2xl lg:text-3xl'>Purchase Order</h1>
          <p className='mt-1 text-xs sm:text-sm text-gray-400'>{purchase.invoice_number}</p>
        </div>
        <div className='w-full sm:w-auto'>
          <Link href={`/client/purchase/${id}/edit`} className='flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold duration-150 hover:bg-gray-50 sm:w-auto'>
            <GoPencil /> Edit
          </Link>
        </div>
      </div>

      <div className='flex flex-col items-start gap-4 sm:gap-6 lg:flex-row'>
        <div className='flex flex-1 flex-col gap-6'>
          <div className='rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:p-6'>
            <h2 className='mb-4 sm:mb-6 text-base sm:text-lg font-bold'>Order Details</h2>
            <div className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
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
                  {purchase.seller_name}
                  {purchase.company_name ? ` (${purchase.company_name})` : ''}
                </Link>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Location</p>
                <p className='font-medium'>{purchase.location_name || '-'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Created By</p>
                <p className='font-medium'>{purchase.created_by_name || '-'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Payment Status</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-700' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {purchase.payment_status}
                </span>
              </div>
            </div>
            {purchase.notes && (
              <>
                <hr className='my-5' />
                <p className='mb-1 text-sm text-gray-400'>Notes</p>
                <p className='rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600'>{purchase.notes}</p>
              </>
            )}
          </div>

          <div className='rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:p-6'>
            <h2 className='mb-4 sm:mb-6 text-base sm:text-lg font-bold'>Items ({items.length})</h2>
            {items.length === 0 ? (
              <p className='py-10 text-center text-gray-400'>No items</p>
            ) : (
              <div className='overflow-x-auto -mx-3 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6'>
                <table className='min-w-[640px] w-full text-left'>
                  <thead>
                    <tr className='border-b bg-gray-50'>
                      <th className='p-3 text-sm text-gray-500'>Product</th>
                      <th className='p-3 text-sm text-gray-500'>Batch</th>
                      <th className='p-3 text-sm text-gray-500'>Expiry</th>
                      <th className='p-3 text-sm text-gray-500'>Qty</th>
                      <th className='p-3 text-sm text-gray-500'>Rate</th>
                      <th className='p-3 text-sm text-gray-500'>Tax %</th>
                      <th className='p-3 text-right text-sm text-gray-500'>Subtotal</th>
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
                          <td className='p-3 text-sm text-gray-500'>{item.batch_no || '-'}</td>
                          <td className='p-3 text-sm text-gray-500'>{item.expire_date ? new Date(item.expire_date).toLocaleDateString('en-IN') : '-'}</td>
                          <td className='p-3 text-sm'>{item.quantity}</td>
                          <td className='p-3 text-sm'>Rs. {(item.buying_rate || 0).toLocaleString('en-IN')}</td>
                          <td className='p-3 text-sm'>{item.tax_percent || 0}%</td>
                          <td className='p-3 text-right text-sm font-medium'>Rs. {(subtotal + tax).toLocaleString('en-IN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className='w-full lg:w-[300px] xl:w-[320px] lg:sticky lg:top-24 flex flex-col gap-4 sm:gap-6'>
          <div className='rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:p-6'>
            <h2 className='mb-4 sm:mb-5 text-base sm:text-lg font-bold'>Payment Summary</h2>
            <div className='flex flex-col gap-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Subtotal</span>
                <span>Rs. {(purchase.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Tax</span>
                <span>Rs. {(purchase.tax_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Discount</span>
                <span className='text-red-500'>-Rs. {(purchase.discount_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='my-1 h-px w-full bg-gray-200'></div>
              <div className='flex items-center justify-between'>
                <span className='text-base font-bold'>Grand Total</span>
                <span className='text-xl font-bold text-[#008C83]'>Rs. {(purchase.final_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='my-1 h-px w-full bg-gray-200'></div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Paid</span>
                <span className='font-medium text-green-600'>Rs. {(purchase.paid_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Due</span>
                <span className={`font-semibold ${due > 0 ? 'text-red-500' : 'text-green-500'}`}>Rs. {Math.max(0, due).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <Link href={`/client/supplier/${purchase.seller_id}/view`} className='rounded-xl border border-transparent bg-white p-5 duration-200 hover:border-[#008C83] hover:bg-[#E6FFFD]'>
            <p className='mb-1 text-xs text-gray-400'>Supplier</p>
            <p className='font-semibold text-[#008C83]'>{purchase.seller_name}</p>
            {purchase.company_name && <p className='mt-0.5 text-xs text-gray-400'>{purchase.company_name}</p>}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ViewPurchase
