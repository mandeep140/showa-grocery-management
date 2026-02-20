'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  HiMiniMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineUser,
  HiMinusSmall,
  HiPlusSmall,
  HiOutlineQrCode,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { BiPrinter } from 'react-icons/bi'
import { RiSecurePaymentLine } from 'react-icons/ri'
import { FiTrash2 } from 'react-icons/fi'
import api from '@/util/api'
import { getCurrentServerURL } from '@/util/api'

const CashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 5H3.334C2.413 5 1.667 5.746 1.667 6.667V13.333C1.667 14.254 2.413 15 3.334 15H16.667C17.587 15 18.334 14.254 18.334 13.333V6.667C18.334 5.746 17.587 5 16.667 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11.667A1.667 1.667 0 1 0 10 8.333a1.667 1.667 0 0 0 0 3.334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const UpiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5.833 2.5H3.333A.833.833 0 0 0 2.5 3.333v2.5a.833.833 0 0 0 .833.834h2.5a.833.833 0 0 0 .834-.834v-2.5A.833.833 0 0 0 5.833 2.5ZM16.666 2.5h-2.5a.833.833 0 0 0-.833.833v2.5c0 .46.373.834.833.834h2.5c.46 0 .834-.373.834-.834v-2.5A.833.833 0 0 0 16.666 2.5ZM5.833 13.333H3.333a.833.833 0 0 0-.833.834v2.5c0 .46.373.833.833.833h2.5c.46 0 .834-.373.834-.833v-2.5a.833.833 0 0 0-.834-.834Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const CreditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 4.167H3.334C2.413 4.167 1.667 4.913 1.667 5.833V14.167c0 .92.746 1.666 1.667 1.666H16.667c.92 0 1.666-.746 1.666-1.666V5.833c0-.92-.746-1.666-1.666-1.666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.667 8.333H18.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
)

const BillingPage = () => {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMode, setPaymentMode] = useState('cash')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [receivedAmount, setReceivedAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')

  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' })

  const searchTimeout = useRef(null)
  const selectedLocationRef = useRef('')
  const serverURL = getCurrentServerURL()

  useEffect(() => {
    loadCustomers()
    // Load locations first, then products with correct location
    const init = async () => {
      try {
        const res = await api.get('/api/locations')
        if (res.data.success) {
          const stores = res.data.locations.filter(l => l.location_type === 'shop' || l.location_type === 'store')
          setLocations(stores)
          if (stores.length > 0) {
            setSelectedLocation(stores[0].id)
            selectedLocationRef.current = stores[0].id
            loadProducts('', stores[0].id)
          } else {
            loadProducts('')
          }
        }
      } catch (err) {
        console.error('Failed to load locations:', err)
        loadProducts('')
      }
    }
    init()
  }, [])

  const loadProducts = async (search = '', locationId) => {
    try {
      const locId = locationId !== undefined ? locationId : selectedLocationRef.current
      let url = search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products'
      if (locId) url += `${search ? '&' : '?'}location_id=${locId}`
      const res = await api.get(url)
      if (res.data.success) setProducts(res.data.products)
    } catch (err) { console.error('Failed to load products:', err) }
  }

  const loadCustomers = async () => {
    try {
      const res = await api.get('/api/customers?is_active=1')
      if (res.data.success) setCustomers(res.data.customers)
    } catch (err) { console.error('Failed to load customers:', err) }
  }

  const handleLocationChange = (locId) => {
    setSelectedLocation(locId)
    selectedLocationRef.current = locId
    loadProducts(searchQuery, locId)
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => loadProducts(value), 300)
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      try {
        const res = await api.get(`/api/products/barcode/${encodeURIComponent(searchQuery.trim())}`)
        if (res.data.success && res.data.product) {
          addToCart(res.data.product)
          setSearchQuery('')
          loadProducts('')
          return
        }
      } catch {}
      loadProducts(searchQuery)
    }
  }

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        const isBulk = product.bulk_quantity && newQty >= product.bulk_quantity && product.bulk_price
        return prev.map(c => c.product_id === product.id ? { 
          ...c, 
          quantity: newQty,
          selling_price: isBulk ? product.bulk_price : product.default_selling_price,
          is_bulk: isBulk
        } : c)
      }
      const isBulk = product.bulk_quantity && 1 >= product.bulk_quantity && product.bulk_price
      return [...prev, {
        product_id: product.id,
        name: product.name,
        selling_price: isBulk ? product.bulk_price : (product.default_selling_price || 0),
        tax_percent: product.tax_percent || 0,
        quantity: 1,
        stock: product.total_stock || 0,
        unit: product.unit || 'pcs',
        img_path: product.img_path || null,
        product_code: product.product_code || '',
        bulk_quantity: product.bulk_quantity || null,
        bulk_price: product.bulk_price || null,
        default_selling_price: product.default_selling_price || 0,
        is_bulk: isBulk
      }]
    })
  }, [])

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id !== productId) return item
      const newQty = Math.max(1, item.quantity + delta)
      const isBulk = item.bulk_quantity && newQty >= item.bulk_quantity && item.bulk_price
      return { 
        ...item, 
        quantity: newQty,
        selling_price: isBulk ? item.bulk_price : item.default_selling_price,
        is_bulk: isBulk
      }
    }))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(c => c.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0)
  const taxTotal = cart.reduce((sum, item) => {
    const sub = item.selling_price * item.quantity
    return sum + sub * (item.tax_percent || 0) / 100
  }, 0)
  const discount = Number(discountAmount) || 0
  const total = Math.max(0, subtotal + taxTotal - discount)
  const received = receivedAmount === '' ? total : Math.min(Number(receivedAmount) || 0, total)
  const dueAmount = Math.max(0, total - received)

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  )

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
  }

  const selectWalkIn = () => {
    setSelectedCustomer({ id: null, name: 'Walk-in Customer', phone: '', isWalkIn: true })
    setCustomerSearch('Walk-in Customer')
    setShowCustomerDropdown(false)
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
  }

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false)
    setCustomerForm({ name: '', phone: '', address: '' })
  }

  const saveAndSelectCustomer = async () => {
    if (!customerForm.name.trim()) return
    try {
      const res = await api.post('/api/customers', {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        address: customerForm.address.trim() || null,
      })
      if (res.data.success) {
        const newCustomer = { id: res.data.id, name: customerForm.name.trim(), phone: customerForm.phone.trim() }
        setCustomers(prev => [...prev, newCustomer])
        selectCustomer(newCustomer)
        closeCustomerModal()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer')
    }
  }

  const handlePayAndSave = async () => {
    if (submitting) return
    if (cart.length === 0) return alert('Cart is empty')
    if (!selectedLocation) return alert('No location selected')

    if (dueAmount > 0 && (!selectedCustomer || selectedCustomer.isWalkIn)) {
      return alert('Please select a real customer for partial/credit payment (not walk-in)')
    }

    let buyerId = selectedCustomer?.id
    if (!buyerId) {
      try {
        const res = await api.get('/api/customers?search=Walk-in')
        const walkIn = res.data.customers?.find(c => c.name === 'Walk-in Customer')
        if (walkIn) {
          buyerId = walkIn.id
        } else {
          const createRes = await api.post('/api/customers', { name: 'Walk-in Customer', phone: '0000000000' })
          if (createRes.data.success) buyerId = createRes.data.id
        }
      } catch {
        return alert('Failed to set up walk-in customer')
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        buyer_id: buyerId,
        location_id: selectedLocation,
        discount_amount: discount,
        received_amount: received,
        payment_method: paymentMode,
        notes: null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          selling_price: item.selling_price,
          tax_percent: item.tax_percent || 0,
          discount_percent: 0,
        }))
      }

      const res = await api.post('/api/orders', payload)
      if (res.data.success) {
        alert(`Sale completed! Invoice: ${res.data.invoice_id}`)
        setCart([])
        clearCustomer()
        setPaymentMode('cash')
        setReceivedAmount('')
        setDiscountAmount('')
        loadProducts('')
      } else {
        alert(res.data.message || 'Failed to create sale')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create sale')
    } finally {
      setSubmitting(false)
    }
  }

  const getProductImage = (product) => {
    if (product.img_path) {
      return `${serverURL}/api/products/image/${product.img_path}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#E6FFFD] px-6 pb-6 pt-20">
      <div className="flex gap-5 items-start">
        {/* LEFT: Products */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
            <HiMiniMagnifyingGlass className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search products or scan barcode (Press Enter)..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button type="button" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 duration-150">
              <HiOutlineQrCode className="h-5 w-5" />
            </button>
          </div>
          {locations.length > 1 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Store</label>
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#008C83]"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const imgSrc = getProductImage(product)
              const inCart = cart.find(c => c.product_id === product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.total_stock <= 0}
                  className={`group flex flex-col rounded-xl border bg-white p-2.5 shadow-sm text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${inCart ? 'border-[#008C83] ring-1 ring-[#008C83]/20' : 'border-gray-100'}`}
                >
                  <div className="relative mb-2 h-30 w-full overflow-hidden rounded-lg bg-gray-100">
                    {imgSrc ? (
                      <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-xs">No Image</div>
                    )}
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-[#008C83] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      ₹{product.default_selling_price || 0}
                    </span>
                    {inCart && (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ×{inCart.quantity}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[32px]">{product.name}</h3>
                  <div className="mt-auto pt-1 flex items-center justify-between">
                    <p className="text-[11px] text-gray-400 font-medium">{product.product_code}</p>
                    <p className="text-[11px] text-gray-500">Stock: {product.total_stock || 0}</p>
                  </div>
                </button>
              )
            })}
            {products.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 text-sm">No products found</div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="w-[340px] flex-shrink-0 sticky top-20">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-gray-100">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 h-10">
                    <HiOutlineUser className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {selectedCustomer ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="text-sm truncate">{selectedCustomer.name}</span>
                        <button type="button" onClick={clearCustomer} className="ml-auto p-0.5 text-gray-400 hover:text-red-400 cursor-pointer">
                          <HiOutlineXMark className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        placeholder="Search customer..."
                      />
                    )}
                  </div>

                  {showCustomerDropdown && !selectedCustomer && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onMouseDown={selectWalkIn}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500">W</span>
                        <div>
                          <p className="font-medium text-gray-700">Walk-in Customer</p>
                          <p className="text-[11px] text-gray-400">One-time / anonymous customer</p>
                        </div>
                      </button>

                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => selectCustomer(c)}
                          className="w-full text-left px-3 py-2 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-full bg-[#008C83] flex items-center justify-center text-[11px] font-bold text-white">
                            {c.name?.[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-700 truncate">{c.name}</p>
                            {c.phone && <p className="text-[11px] text-gray-400">{c.phone}</p>}
                          </div>
                          {c.total_debt > 0 && (
                            <span className="ml-auto text-[11px] font-semibold text-red-500">₹{c.total_debt}</span>
                          )}
                        </button>
                      ))}

                      {filteredCustomers.length === 0 && !customerSearch && (
                        <p className="px-3 py-3 text-xs text-gray-400 text-center">No customers found</p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6FFFD] text-[#008C83] hover:bg-[#d0f5f0] duration-150 flex-shrink-0 cursor-pointer"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <HiOutlineUserPlus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <HiOutlineUser className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Click products to add</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {cart.map(item => (
                    <div key={item.product_id} className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5">₹{item.selling_price} × {item.quantity}</p>
                          {item.is_bulk && (
                            <p className="text-[10px] text-green-600 font-medium mt-0.5">✓ Bulk price applied</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateQuantity(item.product_id, -1)} className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 cursor-pointer">
                            <HiMinusSmall className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product_id, 1)} className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 cursor-pointer">
                            <HiPlusSmall className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-800 min-w-[50px] text-right">₹{(item.selling_price * item.quantity).toFixed(0)}</p>
                        <button type="button" onClick={() => removeFromCart(item.product_id)} className="p-1 text-gray-300 hover:text-red-400 cursor-pointer">
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-3.5">
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{taxTotal.toFixed(2)}</span>
                  </div>
                )}
                {/* Discount */}
                <div className="flex items-center justify-between gap-2">
                  <span>Discount</span>
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0"
                    className="w-20 text-right px-2 py-0.5 border border-gray-200 rounded text-sm outline-none focus:border-[#008C83]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-[#008C83]">₹{total.toFixed(2)}</span>
              </div>

              {/* Received Amount & Due */}
              {selectedCustomer && !selectedCustomer.isWalkIn && cart.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">Received ₹</span>
                    <input
                      type="number"
                      min={0}
                      max={total}
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder={total.toFixed(0)}
                      className="w-24 text-right px-2 py-1 border border-gray-200 rounded text-sm font-medium outline-none focus:border-[#008C83]"
                    />
                  </div>
                  {dueAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-500 font-medium">Due (Debt)</span>
                      <span className="text-red-500 font-bold">₹{dueAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {dueAmount <= 0 && receivedAmount !== '' && (
                    <p className="text-[11px] text-green-600 font-medium">✓ Fully paid</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-3.5 pb-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'cash', label: 'Cash', Icon: CashIcon, active: 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]' },
                  { key: 'upi', label: 'UPI', Icon: UpiIcon, active: 'border-blue-400 bg-blue-50 text-blue-600' },
                  { key: 'credit', label: 'Credit', Icon: CreditIcon, active: 'border-orange-400 bg-orange-50 text-orange-600' },
                ].map(({ key, label, Icon, active }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMode(key)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[12px] font-medium border cursor-pointer duration-150 ${
                      paymentMode === key ? active : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3.5 pt-2">
              <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500 hover:bg-gray-100 duration-150 cursor-pointer">
                <BiPrinter className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={handlePayAndSave}
                disabled={submitting || cart.length === 0}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#00756E] duration-150 cursor-pointer disabled:opacity-50"
              >
                <RiSecurePaymentLine className="h-4 w-4" />
                {submitting ? 'Saving...' : dueAmount > 0 ? `Pay ₹${received.toFixed(0)} + Debt` : 'Pay & Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Add New Customer</h2>
              <button type="button" onClick={closeCustomerModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Name <span className="text-red-500">*</span></label>
                <input
                  className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Phone</label>
                <input
                  className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm outline-none focus:border-[#008C83] duration-200"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
                <textarea
                  className="w-full h-20 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[#008C83] duration-200"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Address (optional)"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeCustomerModal} className="h-10 px-5 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 duration-150 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAndSelectCustomer}
                disabled={!customerForm.name.trim()}
                className="h-10 px-5 rounded-lg bg-[#008C83] text-sm font-semibold text-white hover:bg-[#00756E] duration-150 disabled:opacity-50 cursor-pointer"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingPage