'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import { FiPlus, FiTrash2, FiCheck } from "react-icons/fi"
import { MdOutlineInventory } from "react-icons/md"
import { IoChevronDown } from "react-icons/io5"
import { HiOutlineXMark } from "react-icons/hi2"
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
  price_unit: '',
})

const AddPurchase = () => {
  const router = useRouter()
  const [sellers, setSellers] = useState([])
  const [locations, setLocations] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const submittedRef = useRef(false)
  const supplierDropdownRef = useRef(null)
  const locationDropdownRef = useRef(null)

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
    const currentSearchTimeouts = searchTimeouts.current
    const currentAbortControllers = abortControllers.current
    return () => {
      Object.values(currentSearchTimeouts).forEach(clearTimeout)
      Object.values(currentAbortControllers).forEach(c => c.abort())
    }
  }, [])

  useEffect(() => {
    const handleOutside = (event) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setSupplierDropdownOpen(false)
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setLocationDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const updateItem = useCallback((key, updates) => {
    setItems(prev => prev.map(item => item._key === key ? { ...item, ...updates } : item))
  }, [])

  const addItem = useCallback(() => {
    setItems(prev => [emptyItem(), ...prev])
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
      price_unit: product.price_unit || '',
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


  const priceMultiplier = (item) => item.price_unit ? 2 : 1

  const calcItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.buying_rate) || 0
    const sub = qty * rate * priceMultiplier(item)
    return sub + sub * (parseFloat(item.tax_percent) || 0) / 100
  }

  const getSubtotal = () =>
    items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.buying_rate) || 0) * priceMultiplier(i), 0)

  const getTaxTotal = () =>
    items.reduce((s, i) => {
      const sub = (parseFloat(i.quantity) || 0) * (parseFloat(i.buying_rate) || 0) * priceMultiplier(i)
      return s + sub * (parseFloat(i.tax_percent) || 0) / 100
    }, 0)

  const getGrandTotal = () =>
    getSubtotal() + getTaxTotal() - (parseFloat(formData.discount_amount) || 0)

  const selectedSupplier = sellers.find((s) => String(s.id) === String(formData.seller_id))
  const selectedSupplierLabel = selectedSupplier
    ? `${selectedSupplier.name}${selectedSupplier.company_name ? ` - ${selectedSupplier.company_name}` : ''}`
    : 'Select supplier'
  const selectedLocationLabel = locations.find((l) => String(l.id) === String(formData.location_id))?.name || 'Select location'

  const handleSubmit = useCallback(async () => {
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
        buying_rate: parseFloat(item.buying_rate) * (item.price_unit ? 2 : 1),
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

  // Quick Add Product Modal
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '', unit: 'pcs', default_buying_rate: '', default_selling_price: '',
    bulk_quantity: '', bulk_price: '', tax_percent: '', barcode: ''
  })

  const resetNewProduct = () => setNewProduct({
    name: '', unit: 'pcs', default_buying_rate: '', default_selling_price: '',
    bulk_quantity: '', bulk_price: '', tax_percent: '', barcode: ''
  })

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return alert('Product name is required')
    setAddingProduct(true)
    try {
      const priceUnit = ['kg', 'g'].includes(newProduct.unit) ? '500g' : ['liter', 'ml'].includes(newProduct.unit) ? '500ml' : null
      const payload = {
        name: newProduct.name.trim(),
        unit: newProduct.unit,
        price_unit: priceUnit,
        default_buying_rate: parseFloat(newProduct.default_buying_rate) || 0,
        default_selling_price: parseFloat(newProduct.default_selling_price) || 0,
        bulk_quantity: parseFloat(newProduct.bulk_quantity) || null,
        bulk_price: parseFloat(newProduct.bulk_price) || null,
        tax_percent: parseFloat(newProduct.tax_percent) || 0,
        barcode: newProduct.barcode.trim() || null,
      }
      const res = await api.post('/api/products', payload)
      if (res.data.success) {
        alert('Product created!')
        setShowAddProduct(false)
        resetNewProduct()
      } else {
        alert(res.data.message || 'Failed to create product')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product')
    } finally {
      setAddingProduct(false)
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-24' onKeyDown={blockEnter}>
      <Link href="/client/purchase" className='flex items-center mb-4 hover:text-gray-500 duration-200'>
        <IoMdArrowBack /> &nbsp; Back to Purchases
      </Link>

      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <h1 className='text-2xl font-bold sm:text-3xl'>Create Purchase Order</h1>
        <button type="button" onClick={() => handleSubmit()} disabled={submitting} className='flex h-11 items-center justify-center gap-2 rounded-lg bg-[#008C83] px-6 text-sm font-semibold text-white duration-150 hover:bg-[#00756E] cursor-pointer disabled:opacity-50'>
          <FiCheck /> {submitting ? 'Creating...' : 'Create Order'}
        </button>
      </div>

      <div className='flex flex-col gap-6 items-start xl:w-full xl:justify-between xl:flex-row'>
        <div className='w-full flex flex-col gap-6'>
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm'>
            <h2 className='text-lg font-bold mb-6'>Order Details</h2>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Supplier <span className='text-red-500'>*</span></label>
                <div ref={supplierDropdownRef} className='relative'>
                  <button
                    type='button'
                    onClick={() => setSupplierDropdownOpen((prev) => !prev)}
                    className='flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left duration-200 focus:outline-none focus:border-[#008C83]'
                  >
                    <span className='truncate'>{selectedSupplierLabel}</span>
                    <IoChevronDown className='text-sm text-gray-500' />
                  </button>
                  {supplierDropdownOpen && (
                    <div className='absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg'>
                      <button
                        type='button'
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, seller_id: '' }))
                          setSupplierDropdownOpen(false)
                        }}
                        className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                      >
                        Select supplier
                      </button>
                      {sellers.map((s) => (
                        <button
                          key={s.id}
                          type='button'
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, seller_id: s.id }))
                            setSupplierDropdownOpen(false)
                          }}
                          className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0'
                        >
                          {s.name}{s.company_name ? ` - ${s.company_name}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <div ref={locationDropdownRef} className='relative'>
                  <button
                    type='button'
                    onClick={() => setLocationDropdownOpen((prev) => !prev)}
                    className='flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left duration-200 focus:outline-none focus:border-[#008C83]'
                  >
                    <span className='truncate'>{selectedLocationLabel}</span>
                    <IoChevronDown className='text-sm text-gray-500' />
                  </button>
                  {locationDropdownOpen && (
                    <div className='absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg'>
                      <button
                        type='button'
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, location_id: '' }))
                          setLocationDropdownOpen(false)
                        }}
                        className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                      >
                        Select location
                      </button>
                      {locations.map((l) => (
                        <button
                          key={l.id}
                          type='button'
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, location_id: l.id }))
                            setLocationDropdownOpen(false)
                          }}
                          className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0'
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold'>Items</h2>
              <div className='flex items-center gap-3'>
                <button type="button" onClick={() => setShowAddProduct(true)} className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#008C83] font-medium duration-200 cursor-pointer'>
                  <FiPlus /> New Product
                </button>
                <button type="button" onClick={addItem} className='flex items-center gap-1.5 text-[#008C83] hover:text-[#00675B] font-medium duration-200 cursor-pointer'>
                  <FiPlus /> Add Item
                </button>
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {items.map((item) => (
                <div key={item._key} className='border border-gray-100 rounded-lg p-4 bg-gray-50/30'>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div className='flex flex-col gap-1 relative sm:col-span-2'>
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
                      <label className='text-xs text-gray-400'>Quantity{item.price_unit ? ` (${['500g'].includes(item.price_unit) ? 'kg' : 'liter'})` : ''}</label>
                      <input
                        type="number"
                        min={item.price_unit ? "0.001" : "1"}
                        step={item.price_unit ? "0.01" : "1"}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, { quantity: e.target.value })}
                        placeholder="0"
                        className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-xs text-gray-400'>Unit Cost{item.price_unit ? ` (per ${item.price_unit})` : ''}</label>
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

                  <div className='mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4'>
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
                      <span className='text-xs text-gray-400 sm:ml-auto'>Unit: {item.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm'>
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

        <div className='w-full xl:w-125 flex flex-col gap-6 xl:sticky xl:top-24'>
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm'>
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
              onClick={() => handleSubmit()}
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
              <p className='text-xs text-[#4A8C7A] mt-1'>Once this order is marked as &quot;Received&quot;, stock levels for the selected products will be automatically increased in your inventory.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Product Modal */}
      {showAddProduct && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4'>
          <div className='relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-2xl'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-lg font-bold'>Quick Add Product</h2>
              <button type='button' onClick={() => { setShowAddProduct(false); resetNewProduct() }} className='cursor-pointer p-1 text-gray-400 hover:text-gray-600'>
                <HiOutlineXMark className='h-5 w-5' />
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Product Name <span className='text-red-500'>*</span></label>
                <input type='text' value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder='e.g. Basmati Rice' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Unit</label>
                  <select value={newProduct.unit} onChange={(e) => setNewProduct(p => ({ ...p, unit: e.target.value }))} className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#008C83] duration-200'>
                    <option value='pcs'>pcs</option>
                    <option value='kg'>kg</option>
                    <option value='liter'>liter</option>
                    <option value='dozen'>dozen</option>
                    <option value='box'>box</option>
                    <option value='pack'>pack</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Barcode</label>
                  <input type='text' value={newProduct.barcode} onChange={(e) => setNewProduct(p => ({ ...p, barcode: e.target.value }))} placeholder='Optional' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Buying Price{['kg', 'g'].includes(newProduct.unit) ? ' (per 500g)' : ['liter', 'ml'].includes(newProduct.unit) ? ' (per 500ml)' : ''}</label>
                  <input type='number' step='0.01' min='0' value={newProduct.default_buying_rate} onChange={(e) => setNewProduct(p => ({ ...p, default_buying_rate: e.target.value }))} placeholder='0' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Selling Price{['kg', 'g'].includes(newProduct.unit) ? ' (per 500g)' : ['liter', 'ml'].includes(newProduct.unit) ? ' (per 500ml)' : ''}</label>
                  <input type='number' step='0.01' min='0' value={newProduct.default_selling_price} onChange={(e) => setNewProduct(p => ({ ...p, default_selling_price: e.target.value }))} placeholder='0' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Bulk Qty{['kg', 'g'].includes(newProduct.unit) ? ' (kg)' : ['liter', 'ml'].includes(newProduct.unit) ? ' (liter)' : ''}</label>
                  <input type='number' step={['kg', 'g', 'liter', 'ml'].includes(newProduct.unit) ? '0.01' : '1'} min='0' value={newProduct.bulk_quantity} onChange={(e) => setNewProduct(p => ({ ...p, bulk_quantity: e.target.value }))} placeholder='0' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm text-gray-500'>Bulk Price{['kg', 'g'].includes(newProduct.unit) ? ' (per 500g)' : ['liter', 'ml'].includes(newProduct.unit) ? ' (per 500ml)' : ''}</label>
                  <input type='number' step='0.01' min='0' value={newProduct.bulk_price} onChange={(e) => setNewProduct(p => ({ ...p, bulk_price: e.target.value }))} placeholder='0' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm text-gray-500'>Tax %</label>
                <input type='number' step='0.01' min='0' max='100' value={newProduct.tax_percent} onChange={(e) => setNewProduct(p => ({ ...p, tax_percent: e.target.value }))} placeholder='0' className='px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008C83] duration-200' />
              </div>

              <div className='mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                <button type='button' onClick={() => { setShowAddProduct(false); resetNewProduct() }} className='rounded-lg border border-gray-300 px-5 py-2.5 text-sm duration-150 hover:bg-gray-50 cursor-pointer'>
                  Cancel
                </button>
                <button type='button' onClick={handleAddProduct} disabled={addingProduct} className='rounded-lg bg-[#008C83] px-5 py-2.5 text-sm font-medium text-white duration-150 hover:bg-[#00756E] disabled:opacity-50 cursor-pointer'>
                  {addingProduct ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default AddPurchase
