'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { FiPlus, FiTrash2, FiSave, FiCheck } from "react-icons/fi"
import { MdOutlineInventory } from "react-icons/md"
import api from '@/util/api'
import { useRouter } from 'next/navigation'

const emptyItem = () => ({
  _key: Date.now() + Math.random(),
  product_id: '',
  product_name: '',
  quantity: '',
  buying_rate: '',
  tax_percent: '',
  expire_tracking: false,
  expire_date: '',
  searchQuery: '',
  searchResults: [],
  showDropdown: false,
  barcode: '',
  unit: '',
})

const AddPurchase = () => {
  const router = useRouter()
  const [sellers, setSellers] = useState([])
  const [locations, setLocations] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const [formData, setFormData] = useState({
    seller_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    location_id: '',
    discount_amount: 0,
    paid_amount: '',
    notes: ''
  })

  const searchTimeouts = useRef({})
  const abortControllers = useRef({})

  const [items, setItems] = useState([emptyItem()])

  useEffect(() => {
    const load = async () => {
      try {
        const [sellersRes, locationsRes] = await Promise.all([
          api.get('/api/sellers?is_active=1'),
          api.get('/api/locations'),
        ])
        if (sellersRes.data.success) setSellers(sellersRes.data.sellers)
        if (locationsRes.data.success) setLocations(locationsRes.data.locations)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    load()
    return () => {
      Object.values(searchTimeouts.current).forEach(clearTimeout)
      Object.values(abortControllers.current).forEach(c => c.abort())
    }
  }, [])

  const updateItem = useCallback((key, updates) => {
    setItems(prev => prev.map(item => item._key === key ? { ...item, ...updates } : item))
  }, [])

  const addItem = useCallback(() => {
    setItems(prev => [...prev, emptyItem()])
  }, [])

  const removeItem = useCallback((key) => {
    setItems(prev => prev.length <= 1 ? prev : prev.filter(item => item._key !== key))
  }, [])

  const selectProduct = useCallback((key, product) => {
    updateItem(key, {
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode || '',
      unit: product.unit || '',
      buying_rate: product.default_buying_rate || '',
      tax_percent: product.tax_percent || '',
      searchQuery: product.name,
      searchResults: [],
      showDropdown: false,
    })
  }, [updateItem])

  const doSearch = useCallback(async (query, itemKey) => {
    if (!query || query.length < 1) {
      updateItem(itemKey, { searchResults: [], showDropdown: false })
      return
    }

    if (abortControllers.current[itemKey]) {
      abortControllers.current[itemKey].abort()
    }
    const controller = new AbortController()
    abortControllers.current[itemKey] = controller

    try {
      const res = await api.get(`/api/products/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
      if (res.data.success) {
        const products = res.data.products || []
        if (products.length === 1 && products[0].barcode && products[0].barcode === query) {
          selectProduct(itemKey, products[0])
        } else {
          updateItem(itemKey, { searchResults: products, showDropdown: products.length > 0 })
        }
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Search failed:', err)
      }
    }
  }, [updateItem, selectProduct])

  const handleSearchChange = useCallback((key, value) => {
    updateItem(key, { searchQuery: value, product_id: '', product_name: '' })

    if (searchTimeouts.current[key]) clearTimeout(searchTimeouts.current[key])
    searchTimeouts.current[key] = setTimeout(() => doSearch(value, key), 350)
  }, [updateItem, doSearch])


  const calcItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.buying_rate) || 0
    const sub = qty * rate
    return sub + sub * (parseFloat(item.tax_percent) || 0) / 100
  }

  const getSubtotal = () =>
    items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.buying_rate) || 0), 0)

  const getTaxTotal = () =>
    items.reduce((s, i) => {
      const sub = (parseFloat(i.quantity) || 0) * (parseFloat(i.buying_rate) || 0)
      return s + sub * (parseFloat(i.tax_percent) || 0) / 100
    }, 0)

  const getGrandTotal = () =>
    getSubtotal() + getTaxTotal() - (parseFloat(formData.discount_amount) || 0)

  const handleSubmit = useCallback(async (isDraft = false) => {
    if (submittedRef.current || submitting) return
    if (!formData.seller_id) return alert('Please select a supplier')
    if (!formData.invoice_number) return alert('Please enter invoice number')
    if (!formData.location_id) return alert('Please select a location')
    if (!formData.purchase_date) return alert('Please select purchase date')

    const validItems = items.filter(item => item.product_id && item.quantity && item.buying_rate)
    if (validItems.length === 0) return alert('Please add at least one valid item')

    for (const item of validItems) {
      if (item.expire_tracking && !item.expire_date) {
        return alert(`Please set expiry date for ${item.product_name}`)
      }
    }

    submittedRef.current = true
    setSubmitting(true)

    const payload = {
      invoice_number: formData.invoice_number,
      seller_id: formData.seller_id,
      location_id: formData.location_id,
      purchase_date: formData.purchase_date,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      paid_amount: parseFloat(formData.paid_amount) || 0,
      notes: formData.notes || null,
      items: validItems.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        buying_rate: parseFloat(item.buying_rate),
        tax_percent: parseFloat(item.tax_percent) || 0,
        expire_date: item.expire_tracking ? item.expire_date : null,
      })),
    }

    try {
      const res = await api.post('/api/purchases', payload)
      if (res.data.success) {
        alert('Purchase order created successfully!')
        router.push('/client/purchase')
      } else {
        alert(res.data.message || 'Failed to create purchase order')
        submittedRef.current = false
        setSubmitting(false)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create purchase order')
      submittedRef.current = false
      setSubmitting(false)
    }
  }, [formData, items, router, submitting])

  const blockEnter = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation() }
  }, [])

  return (
    <form onSubmit={(e) => e.preventDefault()} className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]' onKeyDown={blockEnter}>
      <Link href="/client/purchase" className='flex items-center mb-4 hover:text-gray-500 duration-200'>
        <IoMdArrowBack /> &nbsp; Back to Purchases
      </Link>

      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold'>Create Purchase Order</h1>
        <div className='flex gap-3'>
          <button type="button" onClick={() => handleSubmit(true)} disabled={submitting} className='flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 duration-200 cursor-pointer disabled:opacity-50'>
            <FiSave /> Save as Draft
          </button>
          <button type="button" onClick={() => handleSubmit(false)} disabled={submitting} className='flex items-center gap-2 px-5 py-2.5 bg-[#008C83] text-white rounded-lg hover:bg-[#00675B] duration-200 cursor-pointer disabled:opacity-50'>
            <FiCheck /> Create Order
          </button>
        </div>
      </div>

      <div className='flex gap-6 items-start'>
        <div className='flex-1 flex flex-col gap-6'>
          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <h2 className='text-lg font-bold mb-6'>Order Details</h2>
            <div className='grid grid-cols-2 gap-5'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Supplier <span className='text-red-500'>*</span></label>
                <select
                  value={formData.seller_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, seller_id: e.target.value }))}
                  className='px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#008C83] duration-200'
                >
                  <option value="">Select supplier</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.company_name ? ` - ${s.company_name}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Purchase Date <span className='text-red-500'>*</span></label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  className='px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#008C83] duration-200'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Reference / Invoice No.</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  placeholder="INV-0001"
                  className='px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#008C83] duration-200'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Location <span className='text-red-500'>*</span></label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
                  className='px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#008C83] duration-200'
                >
                  <option value="">Select location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold'>Items</h2>
              <button type="button" onClick={addItem} className='flex items-center gap-1.5 text-[#008C83] hover:text-[#00675B] font-medium duration-200 cursor-pointer'>
                <FiPlus /> Add Item
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              {items.map((item) => (
                <div key={item._key} className='border border-gray-100 rounded-lg p-4 bg-gray-50/30'>
                  <div className='grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-3 items-end'>
                    <div className='flex flex-col gap-1 relative'>
                      <label className='text-xs text-gray-400'>Product</label>
                      <input
                        type="text"
                        value={item.searchQuery}
                        onChange={(e) => handleSearchChange(item._key, e.target.value)}
                        onFocus={() => { if (item.searchResults.length > 0) updateItem(item._key, { showDropdown: true }) }}
                        onBlur={() => setTimeout(() => updateItem(item._key, { showDropdown: false }), 200)}
                        placeholder="Search by name or barcode"
                        className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                      {item.showDropdown && item.searchResults.length > 0 && (
                        <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto'>
                          {item.searchResults.map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onMouseDown={() => selectProduct(item._key, product)}
                              className='w-full text-left px-3 py-2 hover:bg-[#E6FFFD] duration-150 flex items-center justify-between text-sm border-b border-gray-50 last:border-0 cursor-pointer'
                            >
                              <span>
                                <p className='font-medium'>{product.name}</p>
                                <p className='text-xs text-gray-400'>{product.barcode || product.product_code} &middot; {product.unit}</p>
                              </span>
                              <span className='text-xs text-gray-400'>Stock: {product.total_stock}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400'>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, { quantity: e.target.value })}
                        placeholder="0"
                        className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400'>Unit Cost</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.buying_rate}
                        onChange={(e) => updateItem(item._key, { buying_rate: e.target.value })}
                        placeholder="0"
                        className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400'>Tax (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.tax_percent}
                        onChange={(e) => updateItem(item._key, { tax_percent: e.target.value })}
                        placeholder="0"
                        className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400'>Total</label>
                      <p className='px-3 py-2 text-sm font-medium'>₹{calcItemTotal(item).toFixed(2)}</p>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400 opacity-0'>Del</label>
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        disabled={items.length === 1}
                        className='p-2 text-gray-400 hover:text-red-500 duration-200 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer'
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className='mt-3 flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.expire_tracking}
                          onChange={() => updateItem(item._key, { expire_tracking: !item.expire_tracking, expire_date: '' })}
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008C83]"></div>
                      </label>
                      <span className='text-xs text-gray-500'>Expiry date</span>
                    </div>
                    {item.expire_tracking && (
                      <input
                        type="date"
                        value={item.expire_date}
                        onChange={(e) => updateItem(item._key, { expire_date: e.target.value })}
                        className='px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                    )}
                    {item.unit && (
                      <span className='text-xs text-gray-400 ml-auto'>Unit: {item.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <h2 className='text-lg font-bold mb-4'>Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this purchase order..."
              rows={4}
              className='w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#008C83] duration-200 text-sm'
            />
          </div>
        </div>

        <div className='w-[300px] flex flex-col gap-6 sticky top-24'>
          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <h2 className='text-lg font-bold mb-5'>Order Summary</h2>
            <div className='flex flex-col gap-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Subtotal</span>
                <span>₹{getSubtotal().toFixed(2)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Tax</span>
                <span>₹{getTaxTotal().toFixed(2)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Discount</span>
                <div className='flex items-center border border-gray-200 rounded-lg overflow-hidden w-24'>
                  <span className='px-1.5 py-1 bg-gray-50 text-gray-400 text-xs border-r border-gray-200'>₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                    className='px-1.5 py-1 text-xs focus:outline-none w-full text-right'
                  />
                </div>
              </div>
              <div className='w-full h-px bg-gray-200 my-1'></div>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-base'>Grand Total</span>
                <span className='font-bold text-xl text-[#008C83]'>₹{getGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className='mt-5 flex flex-col gap-1.5'>
              <label className='text-sm text-gray-500'>Paid Amount</label>
              <div className='flex items-center border border-gray-200 rounded-lg overflow-hidden'>
                <span className='px-2 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-200'>₹</span>
                <input
                  type="number"
                  min="0"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                  placeholder="0.00"
                  className='px-2 py-2 text-sm focus:outline-none w-full'
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className='w-full mt-5 py-3 bg-[#008C83] text-white rounded-lg font-medium hover:bg-[#00675B] duration-200 cursor-pointer disabled:opacity-50'
            >
              {submitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/client/purchase')}
              className='w-full mt-2 py-3 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 duration-200 cursor-pointer'
            >
              Cancel
            </button>
          </div>

          <div className='bg-[#E8FFF5] border border-[#B0E8D0] rounded-xl p-5 flex gap-3'>
            <MdOutlineInventory className='text-[#008C83] text-xl mt-0.5 flex-shrink-0' />
            <div>
              <p className='font-semibold text-sm text-[#006B5A]'>Inventory Update</p>
              <p className='text-xs text-[#4A8C7A] mt-1'>Once this order is marked as "Received", stock levels for the selected products will be automatically increased in your inventory.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default AddPurchase