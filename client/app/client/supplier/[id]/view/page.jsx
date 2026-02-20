'use client'
import React, { useState, useEffect } from 'react'
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

  const fetchSeller = async () => {
    try {
      const res = await api.get(`/api/sellers/${id}`)
      if (res.data.success) setSeller(res.data.seller)
    } catch (err) {
      console.error('Failed to fetch seller:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSeller() }, [id])

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!payData.amount || parseFloat(payData.amount) <= 0) return alert('Enter a valid amount')
    setPaying(true)
    try {
      const res = await api.post(`/api/sellers/${id}/pay`, {
        amount: parseFloat(payData.amount),
        payment_method: payData.payment_method,
        notes: payData.notes || null
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

  if (loading) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Loading...</div>
  if (!seller) return <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD] flex items-center justify-center text-gray-400'>Supplier not found</div>

  const stats = seller.stats || {}
  const lastPurchase = seller.recent_purchases?.[0]

  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
      <Link href="/client/supplier" className='flex items-center mb-8 hover:text-gray-500 duration-200'><IoMdArrowBack /> &nbsp; Back to suppliers</Link>

      <div className='flex items-center justify-between mb-10'>
        <h1 className='text-3xl font-bold'>Supplier Details</h1>
        <div className='flex gap-3'>
          <button onClick={() => setShowPayModal(true)} className='px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 duration-200 cursor-pointer flex items-center gap-2'>
            <FaRupeeSign /> Record Payment
          </button>
          <Link href={`/client/supplier/${id}/edit`} className='px-5 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 duration-200 flex items-center gap-2'>
            <GoPencil /> Edit
          </Link>
        </div>
      </div>

      <div className='w-[80%] mx-auto rounded-xl bg-white p-6 gap-6'>
        <div className='w-full flex items-center justify-between'>
          <h2 className='font-semibold text-lg'>Basic information</h2>
          <p className={seller.is_active ? 'text-green-500' : 'text-gray-400'}>{seller.is_active ? 'Active' : 'Inactive'}</p>
        </div>
        <div className='w-full flex mt-6'>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>Supplier Name</p>
            <p className='text-md font-semibold'>{seller.name}</p>
          </div>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>Company</p>
            <p className='text-md'>{seller.company_name || '—'}</p>
          </div>
        </div>
        <div className='w-full flex mt-6'>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>Phone number</p>
            <p className='text-md flex items-center gap-2'>{seller.phone ? <><MdCall className='text-lg text-green-500' /> {seller.phone}</> : '—'}</p>
          </div>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>Email</p>
            <p className='text-md'>{seller.email || '—'}</p>
          </div>
        </div>
        <div className='w-full flex mt-6'>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>Address</p>
            <p className='text-md flex items-center gap-2'>{seller.address ? <><IoLocationSharp className='text-lg text-green-500' /> {seller.address}</> : '—'}</p>
          </div>
          <div className='w-1/2'>
            <p className='text-gray-500 text-sm'>GST / Tax ID</p>
            <p className='text-md'>{seller.gst || '—'}</p>
          </div>
        </div>
        {seller.notes && (
          <>
            <hr className='mt-6' />
            <p className='text-gray-500 text-sm mt-6'>Notes</p>
            <div className='w-full px-4 py-2 bg-gray-100 rounded-md mt-2'>
              <p className='text-gray-500 text-sm'>{seller.notes}</p>
            </div>
          </>
        )}
      </div>

      <div className='mt-10 w-[80%] mx-auto gap-6 flex items-center justify-center'>
        <div className='w-1/3 p-6 bg-white rounded-xl'>
          <div className='flex gap-2 items-center mb-4'>
            <span className='p-4 rounded-xl bg-green-100'><IoTrendingUp className='text-2xl text-green-500 font-semibold' /></span>
            <p className='text-gray-500 text-sm'>Total Purchase</p>
          </div>
          <p className='text-2xl font-bold text-green-500'>₹{(stats.total_purchase_amount || 0).toLocaleString('en-IN')}</p>
          <p className='text-gray-500 text-sm mt-6'>{stats.total_purchases || 0} orders</p>
        </div>
        <div className='w-1/3 p-6 bg-white rounded-xl'>
          <div className='flex gap-2 items-center mb-4'>
            <span className='p-4 rounded-xl bg-blue-100'><CiCalendar className='text-2xl text-blue-500 font-semibold' /></span>
            <p className='text-gray-500 text-sm'>Total Paid</p>
          </div>
          <p className='text-2xl font-bold text-blue-500'>₹{(stats.total_paid || 0).toLocaleString('en-IN')}</p>
          <p className='text-gray-500 text-sm mt-6'>Last: {lastPurchase ? new Date(lastPurchase.purchase_date).toLocaleDateString('en-IN') : '—'}</p>
        </div>
        <div className='w-1/3 p-6 bg-white rounded-xl'>
          <div className='flex gap-2 items-center mb-4'>
            <span className='p-4 rounded-xl bg-red-100'><FaRupeeSign className='text-2xl text-red-500 font-semibold' /></span>
            <p className='text-gray-500 text-sm'>Outstanding</p>
          </div>
          <p className='text-2xl font-bold text-red-500'>₹{(stats.total_pending || 0).toLocaleString('en-IN')}</p>
          <p className='text-gray-500 text-sm mt-6'>Pending payment</p>
        </div>
      </div>

      <div className='w-[80%] mx-auto mt-10'>
        <div className='flex gap-1 mb-0'>
          <button onClick={() => setActiveTab('purchases')} className={`px-6 py-3 rounded-t-lg font-medium text-sm cursor-pointer ${activeTab === 'purchases' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Purchases</button>
          <button onClick={() => setActiveTab('payments')} className={`px-6 py-3 rounded-t-lg font-medium text-sm cursor-pointer ${activeTab === 'payments' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Payments</button>
          <button onClick={() => setActiveTab('products')} className={`px-6 py-3 rounded-t-lg font-medium text-sm cursor-pointer ${activeTab === 'products' ? 'bg-white text-[#008C83]' : 'bg-gray-200 text-gray-500'}`}>Products Supplied</button>
        </div>

        {activeTab === 'purchases' && (
          <div className='bg-white rounded-b-xl rounded-tr-xl'>
            <h2 className='text-lg font-semibold px-6 py-4'><FaFileAlt className='inline-block text-green-500 mr-2' />Recent Purchases</h2>
            {(seller.recent_purchases || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No purchases yet</div>
            ) : (
              <table className='w-full text-left'>
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
                      <td className='p-4 text-sm text-gray-500'>{purchase.location_name || '—'}</td>
                      <td className='p-4 text-green-700'>₹{(purchase.final_amount || 0).toLocaleString('en-IN')}</td>
                      <td className='p-4 text-sm'>₹{(purchase.paid_amount || 0).toLocaleString('en-IN')}</td>
                      <td className='p-4'>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-700' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {purchase.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className='w-full px-6 py-4 bg-gray-100 rounded-b-xl'>
              <p className='text-gray-500 text-sm'>Showing {seller.recent_purchases?.length || 0} most recent purchases</p>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className='bg-white rounded-b-xl rounded-tr-xl'>
            <h2 className='text-lg font-semibold px-6 py-4'><FaRupeeSign className='inline-block text-green-500 mr-2' />Recent Payments</h2>
            {(seller.recent_payments || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No payments recorded</div>
            ) : (
              <table className='w-full text-left'>
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
                      <td className='p-4 text-sm text-gray-500'>{new Date(payment.created_at).toLocaleDateString('en-IN')}</td>
                      <td className='p-4 text-sm'>{payment.invoice_number || 'General'}</td>
                      <td className='p-4 text-green-700 font-medium'>₹{(payment.amount || 0).toLocaleString('en-IN')}</td>
                      <td className='p-4 text-sm capitalize'>{payment.payment_method || 'cash'}</td>
                      <td className='p-4 text-sm text-gray-500'>{payment.paid_by_name || '—'}</td>
                      <td className='p-4 text-sm text-gray-400'>{payment.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className='w-full px-6 py-4 bg-gray-100 rounded-b-xl'>
              <p className='text-gray-500 text-sm'>Showing {seller.recent_payments?.length || 0} most recent payments</p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className='bg-white rounded-b-xl rounded-tr-xl p-6'>
            <h2 className='text-lg font-semibold mb-4'>Products Supplied</h2>
            {(seller.products || []).length === 0 ? (
              <div className='p-10 text-center text-gray-400'>No products linked to this supplier yet</div>
            ) : (
              <div className='flex flex-wrap gap-3'>
                {seller.products.map((product) => (
                  <Link key={product.id} href={`/client/inventory/${product.id}/view`} className='px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-[#E6FFFD] hover:border-[#008C83] duration-200 text-sm'>
                    <span className='font-medium'>{product.name}</span>
                    <span className='text-gray-400 ml-2 text-xs'>{product.product_code}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPayModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-6 w-[400px]'>
            <h3 className='text-lg font-bold mb-4'>Record Payment</h3>
            <p className='text-sm text-gray-500 mb-4'>Outstanding: <span className='text-red-500 font-semibold'>₹{(stats.total_pending || 0).toLocaleString('en-IN')}</span></p>
            <form onSubmit={handlePayment} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Amount *</label>
                <input type="number" min="1" step="0.01" value={payData.amount} onChange={(e) => setPayData(prev => ({ ...prev, amount: e.target.value }))} placeholder="0.00" required className='px-4 py-2 border border-gray-300 rounded-lg' />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Payment Method</label>
                <select value={payData.payment_method} onChange={(e) => setPayData(prev => ({ ...prev, payment_method: e.target.value }))} className='px-4 py-2 border border-gray-300 rounded-lg bg-white'>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-500'>Notes</label>
                <input type="text" value={payData.notes} onChange={(e) => setPayData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" className='px-4 py-2 border border-gray-300 rounded-lg' />
              </div>
              <div className='flex gap-3 mt-2'>
                <button type="button" onClick={() => setShowPayModal(false)} className='flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 duration-150 cursor-pointer'>Cancel</button>
                <button type="submit" disabled={paying} className='flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 duration-200 disabled:opacity-50 cursor-pointer'>{paying ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default View