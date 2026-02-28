'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { useParams } from 'next/navigation'
import { MdCall } from "react-icons/md"
import { IoLocationSharp } from "react-icons/io5"
import { IoTrendingUp } from "react-icons/io5"
import { CiCalendar } from "react-icons/ci"
import { FaRupeeSign, FaFileAlt } from "react-icons/fa"
import { GoPencil } from "react-icons/go"
import api from '@/util/api'

const View = () => {
  const params = useParams()
  const { id } = params
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchases')
  const [showPayModal, setShowPayModal] = useState(false)
  const [payData, setPayData] = useState({ amount: '', payment_method: 'cash', notes: '' })
  const [paying, setPaying] = useState(false)

  const fetchSeller = useCallback(async () => {
    try {
      const res = await api.get(`/api/sellers/${id}`)
      if (res.data.success) setSeller(res.data.seller)
    } catch (err) {
      console.error('Failed to fetch seller:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSeller()
  }, [fetchSeller])

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!payData.amount || parseFloat(payData.amount) <= 0) return alert('Enter a valid amount')
    setPaying(true)
    try {
      const res = await api.post(`/api/sellers/${id}/pay`, {
        amount: parseFloat(payData.amount),
        payment_method: payData.payment_method,
        notes: payData.notes || null,
      })
      if (res.data.success) {
        alert('Payment recorded!')
        setShowPayModal(false)
        setPayData({ amount: '', payment_method: 'cash', notes: '' })
        fetchSeller()
      } else {
        alert(res.data.message || 'Payment failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 text-gray-400 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>Loading...</div>
  }

  if (!seller) {
    return <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 text-gray-400 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>Supplier not found</div>
  }

  const stats = seller.stats || {}
  const lastPurchase = seller.recent_purchases?.[0]

  return (
    <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
      <Link href='/client/supplier' className='mb-4 flex items-center duration-200 hover:text-gray-500'>
        <IoMdArrowBack /> &nbsp; Back to suppliers
      </Link>

      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <h1 className='text-2xl font-bold sm:text-3xl'>Supplier Details</h1>
        <div className='grid w-full grid-cols-2 gap-2 md:w-auto'>
          <button onClick={() => setShowPayModal(true)} className='flex h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white duration-200 hover:bg-green-700 cursor-pointer'>
            <FaRupeeSign /> Record Payment
          </button>
          <Link href={`/client/supplier/${id}/edit`} className='flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold duration-200 hover:bg-gray-50'>
            <GoPencil /> Edit
          </Link>
        </div>
      </div>

      <div className='mx-auto w-full rounded-xl bg-white p-4 sm:p-6 lg:max-w-5xl'>
        <div className='flex w-full items-center justify-between'>
          <h2 className='text-lg font-semibold'>Basic information</h2>
          <p className={seller.is_active ? 'text-green-500' : 'text-gray-400'}>{seller.is_active ? 'Active' : 'Inactive'}</p>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <div>
            <p className='text-sm text-gray-500'>Supplier Name</p>
            <p className='text-md font-semibold'>{seller.name}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Company</p>
            <p className='text-md'>{seller.company_name || '-'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Phone number</p>
            <p className='text-md flex items-center gap-2'>
              {seller.phone ? (
                <>
                  <MdCall className='text-lg text-green-500' /> {seller.phone}
                </>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Email</p>
            <p className='text-md'>{seller.email || '-'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Address</p>
            <p className='text-md flex items-center gap-2'>
              {seller.address ? (
                <>
                  <IoLocationSharp className='text-lg text-green-500' /> {seller.address}
                </>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>GST / Tax ID</p>
            <p className='text-md'>{seller.gst || '-'}</p>
          </div>
        </div>

        {seller.notes && (
          <>
            <hr className='mt-6' />
            <p className='mt-6 text-sm text-gray-500'>Notes</p>
            <div className='mt-2 w-full rounded-md bg-gray-100 px-4 py-2'>
              <p className='text-sm text-gray-500'>{seller.notes}</p>
            </div>
          </>
        )}
      </div>

      <div className='mx-auto mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-5xl lg:grid-cols-3 lg:gap-6'>
        <div className='rounded-xl bg-white p-5 sm:p-6'>
          <div className='mb-4 flex items-center gap-2'>
            <span className='rounded-xl bg-green-100 p-3 sm:p-4'><IoTrendingUp className='text-2xl font-semibold text-green-500' /></span>
            <p className='text-sm text-gray-500'>Total Purchase</p>
          </div>
          <p className='text-2xl font-bold text-green-500'>Rs. {(stats.total_purchase_amount || 0).toLocaleString('en-IN')}</p>
          <p className='mt-6 text-sm text-gray-500'>{stats.total_purchases || 0} orders</p>
        </div>

        <div className='rounded-xl bg-white p-5 sm:p-6'>
          <div className='mb-4 flex items-center gap-2'>
            <span className='rounded-xl bg-blue-100 p-3 sm:p-4'><CiCalendar className='text-2xl font-semibold text-blue-500' /></span>
            <p className='text-sm text-gray-500'>Total Paid</p>
          </div>
          <p className='text-2xl font-bold text-blue-500'>Rs. {(stats.total_paid || 0).toLocaleString('en-IN')}</p>
          <p className='mt-6 text-sm text-gray-500'>Last: {lastPurchase ? new Date(lastPurchase.purchase_date).toLocaleDateString('en-IN') : '-'}</p>
        </div>

        <div className='rounded-xl bg-white p-5 sm:p-6 sm:col-span-2 lg:col-span-1'>
          <div className='mb-4 flex items-center gap-2'>
            <span className='rounded-xl bg-red-100 p-3 sm:p-4'><FaRupeeSign className='text-2xl font-semibold text-red-500' /></span>
            <p className='text-sm text-gray-500'>Outstanding</p>
          </div>
          <p className='text-2xl font-bold text-red-500'>Rs. {(stats.total_pending || 0).toLocaleString('en-IN')}</p>
          <p className='mt-6 text-sm text-gray-500'>Pending payment</p>
        </div>
      </div>

      <div className='mx-auto mt-10 w-full lg:max-w-5xl'>
        <div className='mb-0 flex flex-wrap gap-1'>
          <button onClick={() => setActiveTab('purchases')} className={`rounded-t-lg px-4 py-2.5 text-sm font-medium cursor-pointer sm:px-6 sm:py-3 ${activeTab === 'purchases' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Purchases</button>
          <button onClick={() => setActiveTab('payments')} className={`rounded-t-lg px-4 py-2.5 text-sm font-medium cursor-pointer sm:px-6 sm:py-3 ${activeTab === 'payments' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Payments</button>
          <button onClick={() => setActiveTab('products')} className={`rounded-t-lg px-4 py-2.5 text-sm font-medium cursor-pointer sm:px-6 sm:py-3 ${activeTab === 'products' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Products Supplied</button>
        </div>

        {activeTab === 'purchases' && (
          <div className='rounded-b-xl rounded-tr-xl bg-white'>
            <h2 className='px-4 py-4 text-lg font-semibold sm:px-6'><FaFileAlt className='mr-2 inline-block text-green-500' />Recent Purchases</h2>
            {(seller.recent_purchases || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No purchases yet</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-[820px] w-full text-left'>
                  <thead>
                    <tr className='border-y bg-gray-100'>
                      <th className='p-4'>Invoice</th>
                      <th className='p-4'>Date</th>
                      <th className='p-4'>Location</th>
                      <th className='p-4'>Amount</th>
                      <th className='p-4'>Paid</th>
                      <th className='p-4'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seller.recent_purchases.map((purchase, index) => (
                      <tr key={index} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='p-4 text-sm'>
                          <Link href={`/client/purchase/${purchase.id}/view`} className='text-[#008C83] hover:underline'>{purchase.invoice_number}</Link>
                        </td>
                        <td className='p-4 text-sm text-gray-500'>{new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</td>
                        <td className='p-4 text-sm text-gray-500'>{purchase.location_name || '-'}</td>
                        <td className='p-4 text-green-700'>Rs. {(purchase.final_amount || 0).toLocaleString('en-IN')}</td>
                        <td className='p-4 text-sm'>Rs. {(purchase.paid_amount || 0).toLocaleString('en-IN')}</td>
                        <td className='p-4'>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-700' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {purchase.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className='w-full rounded-b-xl bg-gray-100 px-4 py-4 sm:px-6'>
              <p className='text-sm text-gray-500'>Showing {seller.recent_purchases?.length || 0} most recent purchases</p>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className='rounded-b-xl rounded-tr-xl bg-white'>
            <h2 className='px-4 py-4 text-lg font-semibold sm:px-6'><FaRupeeSign className='mr-2 inline-block text-green-500' />Recent Payments</h2>
            {(seller.recent_payments || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No payments recorded</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-[860px] w-full text-left'>
                  <thead>
                    <tr className='border-y bg-gray-100'>
                      <th className='p-4'>Date</th>
                      <th className='p-4'>Invoice</th>
                      <th className='p-4'>Amount</th>
                      <th className='p-4'>Method</th>
                      <th className='p-4'>Paid By</th>
                      <th className='p-4'>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seller.recent_payments.map((payment, index) => (
                      <tr key={index} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='p-4 text-sm text-gray-500'>{new Date(payment.created_at + ' UTC').toLocaleDateString('en-IN')}</td>
                        <td className='p-4 text-sm'>{payment.invoice_number || 'General'}</td>
                        <td className='p-4 font-medium text-green-700'>Rs. {(payment.amount || 0).toLocaleString('en-IN')}</td>
                        <td className='p-4 text-sm capitalize'>{payment.payment_method || 'cash'}</td>
                        <td className='p-4 text-sm text-gray-500'>{payment.paid_by_name || '-'}</td>
                        <td className='p-4 text-sm text-gray-400'>{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className='w-full rounded-b-xl bg-gray-100 px-4 py-4 sm:px-6'>
              <p className='text-sm text-gray-500'>Showing {seller.recent_payments?.length || 0} most recent payments</p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className='rounded-b-xl rounded-tr-xl bg-white p-4 sm:p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Products Supplied</h2>
            {(seller.products || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No products linked to this supplier yet</div>
            ) : (
              <div className='flex flex-wrap gap-3'>
                {seller.products.map((product) => (
                  <Link key={product.id} href={`/client/inventory/${product.id}/view`} className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm duration-200 hover:border-[#008C83] hover:bg-[#E6FFFD]'>
                    <span className='font-medium'>{product.name}</span>
                    <span className='ml-2 text-xs text-gray-400'>{product.product_code}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPayModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='w-full max-w-md rounded-xl bg-white p-5 sm:p-6'>
            <h3 className='mb-4 text-lg font-bold'>Record Payment</h3>
            <p className='mb-4 text-sm text-gray-500'>
              Outstanding: <span className='font-semibold text-red-500'>Rs. {(stats.total_pending || 0).toLocaleString('en-IN')}</span>
            </p>
            <form onSubmit={handlePayment} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Amount *</label>
                <input type='number' min='1' step='0.01' value={payData.amount} onChange={(e) => setPayData((prev) => ({ ...prev, amount: e.target.value }))} placeholder='0.00' required className='rounded-lg border border-gray-300 px-4 py-2' />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Payment Method</label>
                <select value={payData.payment_method} onChange={(e) => setPayData((prev) => ({ ...prev, payment_method: e.target.value }))} className='rounded-lg border border-gray-300 bg-white px-4 py-2'>
                  <option value='cash'>Cash</option>
                  <option value='upi'>UPI</option>
                  <option value='bank_transfer'>Bank Transfer</option>
                  <option value='cheque'>Cheque</option>
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Notes</label>
                <input type='text' value={payData.notes} onChange={(e) => setPayData((prev) => ({ ...prev, notes: e.target.value }))} placeholder='Optional notes' className='rounded-lg border border-gray-300 px-4 py-2' />
              </div>
              <div className='mt-2 flex gap-3'>
                <button type='button' onClick={() => setShowPayModal(false)} className='flex-1 rounded-lg border border-gray-300 py-2 duration-150 hover:bg-gray-50 cursor-pointer'>Cancel</button>
                <button type='submit' disabled={paying} className='flex-1 rounded-lg bg-green-600 py-2 text-white duration-200 hover:bg-green-700 disabled:opacity-50 cursor-pointer'>
                  {paying ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default View
