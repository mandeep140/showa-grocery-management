'use client'
import { useState, useEffect, useRef } from 'react'
import { IoMdArrowBack } from 'react-icons/io'
import { VscDebugRestart } from 'react-icons/vsc'
import { FaBox, FaFileAlt } from 'react-icons/fa'
import { HiMiniMagnifyingGlass } from 'react-icons/hi2'
import { IoClose } from 'react-icons/io5'
import { MdQrCodeScanner } from 'react-icons/md'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/util/api'
import BarcodeScanner from '@/component/BarcodeScanner'

const Return = () => {
  const router = useRouter()
  const [returnType, setReturnType] = useState('customer') // 'customer' | 'seller'

  // Common
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [locationDropdown, setLocationDropdown] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reason, setReason] = useState('')

  // Customer return state
  const [returnItems, setReturnItems] = useState([])
  const [cProductSearch, setCProductSearch] = useState('')
  const [cProductResults, setCProductResults] = useState([])
  const [cShowProductDropdown, setCShowProductDropdown] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDebtInfo, setCustomerDebtInfo] = useState(null)
  const [refundMethod, setRefundMethod] = useState('cash')
  const cProductSearchTimeout = useRef(null)
  const customerSearchTimeout = useRef(null)

  // Seller return state
  const [sellers, setSellers] = useState([])
  const [sellerSearch, setSellerSearch] = useState('')
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [sellerItems, setSellerItems] = useState([]) // [{product_id, batch_id, quantity, buying_rate, product_name, batch_no, max_qty}]
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [batches, setBatches] = useState([])
  const productSearchTimeout = useRef(null)
  const sellerSearchTimeout = useRef(null)
  const locationDropdownRef = useRef(null)

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await api.get('/api/locations')
        if (res.data.success) {
          setLocations(res.data.locations)
          if (res.data.locations.length > 0) setSelectedLocation(res.data.locations[0].id)
        }
      } catch (err) { console.error(err) }
    }
    loadLocations()
  }, [])

  useEffect(() => {
    const handleOutside = (event) => {
      if (!locationDropdownRef.current) return
      if (!locationDropdownRef.current.contains(event.target)) setLocationDropdown(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // --- Customer Return: Product Search ---
  const searchCProducts = async (query) => {
    if (!query.trim()) return setCProductResults([])
    try {
      const res = await api.get(`/api/products?search=${encodeURIComponent(query)}`)
      if (res.data.success) setCProductResults(res.data.products)
    } catch (err) { console.error(err) }
  }

  const handleCProductSearch = (value) => {
    setCProductSearch(value)
    setCShowProductDropdown(true)
    if (cProductSearchTimeout.current) clearTimeout(cProductSearchTimeout.current)
    cProductSearchTimeout.current = setTimeout(() => searchCProducts(value), 300)
  }

  const addReturnItem = (product) => {
    if (returnItems.find(i => i.product_id === product.id)) {
      setReturnItems(prev => prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setReturnItems(prev => [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        selling_price: product.default_selling_price || 0,
        unit: product.unit || 'pcs',
      }])
    }
    setCProductSearch('')
    setCProductResults([])
    setCShowProductDropdown(false)
  }

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    try {
      const res = await api.get(`/api/products/barcode/${encodeURIComponent(barcode)}`)
      if (res.data.success && res.data.products && res.data.products.length > 0) {
        if (res.data.products.length === 1) {
          addReturnItem(res.data.products[0])
        } else {
          setCProductResults(res.data.products)
          setCShowProductDropdown(true)
          setCProductSearch(barcode)
        }
      } else {
        alert('No product found for this barcode')
      }
    } catch (err) { alert('Error looking up barcode') }
  }

  const updateReturnItemQty = (index, qty) => {
    setReturnItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, Number(qty) || 1) } : item))
  }

  const updateReturnItemPrice = (index, price) => {
    setReturnItems(prev => prev.map((item, i) => i === index ? { ...item, selling_price: Number(price) || 0 } : item))
  }

  const removeReturnItem = (index) => {
    setReturnItems(prev => prev.filter((_, i) => i !== index))
  }

  // --- Customer Search (optional for returns) ---
  const searchCustomers = async (query) => {
    if (!query.trim()) return setCustomers([])
    try {
      const res = await api.get(`/api/customers?search=${encodeURIComponent(query)}`)
      if (res.data.success) setCustomers(res.data.customers)
    } catch (err) { console.error(err) }
  }

  const handleCustomerSearch = (value) => {
    setCustomerSearch(value)
    setShowCustomerDropdown(true)
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    customerSearchTimeout.current = setTimeout(() => searchCustomers(value), 300)
  }

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
    setCustomers([])
    try {
      const res = await api.get(`/api/customers/${customer.id}`)
      if (res.data.success) {
        const info = { total_debt: res.data.customer.total_debt || 0, advance_balance: res.data.customer.advance_balance || 0 }
        setCustomerDebtInfo(info)
        setRefundMethod(info.total_debt > 0 ? 'debt_reduce' : 'advance')
      }
    } catch (err) { console.error(err) }
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setCustomerDebtInfo(null)
    setRefundMethod('cash')
  }

  // --- Seller Search ---
  const searchSellers = async (query) => {
    if (!query.trim()) return setSellers([])
    try {
      const res = await api.get(`/api/sellers?search=${encodeURIComponent(query)}`)
      if (res.data.success) setSellers(res.data.sellers)
    } catch (err) { console.error(err) }
  }

  const handleSellerSearch = (value) => {
    setSellerSearch(value)
    setShowSellerDropdown(true)
    if (sellerSearchTimeout.current) clearTimeout(sellerSearchTimeout.current)
    sellerSearchTimeout.current = setTimeout(() => searchSellers(value), 300)
  }

  const selectSeller = (seller) => {
    setSelectedSeller(seller)
    setSellerSearch(seller.name + (seller.company_name ? ` (${seller.company_name})` : ''))
    setShowSellerDropdown(false)
    setSellers([])
  }

  // --- Product search for seller returns ---
  const searchProducts = async (query) => {
    if (!query.trim()) return setProductResults([])
    try {
      const url = selectedLocation
        ? `/api/products?search=${encodeURIComponent(query)}&location_id=${selectedLocation}`
        : `/api/products?search=${encodeURIComponent(query)}`
      const res = await api.get(url)
      if (res.data.success) setProductResults(res.data.products)
    } catch (err) { console.error(err) }
  }

  const handleProductSearch = (value) => {
    setProductSearch(value)
    setShowProductDropdown(true)
    if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    productSearchTimeout.current = setTimeout(() => searchProducts(value), 300)
  }

  const selectProduct = async (product) => {
    setSelectedProduct(product)
    setProductSearch(product.name)
    setShowProductDropdown(false)
    setProductResults([])

    try {
      const url = selectedLocation
        ? `/api/inventory/product/${product.id}?location_id=${selectedLocation}`
        : `/api/inventory/product/${product.id}`
      const res = await api.get(url)
      if (res.data.success) setBatches(res.data.batches)
    } catch (err) { console.error(err) }
  }

  const addSellerItem = (batch) => {
    if (sellerItems.find(i => i.batch_id === batch.id)) return
    setSellerItems(prev => [...prev, {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      batch_id: batch.id,
      batch_no: batch.batch_no || `Batch #${batch.id}`,
      buying_rate: batch.buying_rate || 0,
      quantity: 1,
      max_qty: batch.quantity_remaining,
    }])
    setProductSearch('')
    setSelectedProduct(null)
    setBatches([])
  }

  const updateSellerItemQty = (index, qty) => {
    setSellerItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: Math.min(Number(qty), item.max_qty) } : item
    ))
  }

  const updateSellerItemRate = (index, rate) => {
    setSellerItems(prev => prev.map((item, i) =>
      i === index ? { ...item, buying_rate: Number(rate) } : item
    ))
  }

  const removeSellerItem = (index) => {
    setSellerItems(prev => prev.filter((_, i) => i !== index))
  }

  // --- Submit ---
  const handleCustomerReturn = async () => {
    if (submitting) return
    if (!selectedLocation) return alert('Select a location')
    if (returnItems.length === 0) return alert('Add at least one product to return')

    setSubmitting(true)
    try {
      const payload = {
        location_id: Number(selectedLocation),
        refund_method: selectedCustomer ? refundMethod : 'cash',
        reason: reason || null,
        items: returnItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          selling_price: i.selling_price,
        })),
      }
      if (selectedCustomer) payload.buyer_id = selectedCustomer.id

      const res = await api.post('/api/returns/customer', payload)
      if (res.data.success) {
        let msg = `Return processed: ${res.data.return_number}\nRefund: ₹${res.data.total_refund}`
        if (res.data.debt_cleared > 0) msg += `\nDebt Reduced: ₹${res.data.debt_cleared}`
        if (res.data.advance_saved > 0) msg += `\nAdvance Saved: ₹${res.data.advance_saved}`
        alert(msg)
        router.push('/client/inventory')
      } else {
        alert(res.data.message || 'Failed to process return')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSellerReturn = async () => {
    if (submitting) return
    if (!selectedSeller) return alert('Select a seller')
    if (!selectedLocation) return alert('Select a location')
    if (sellerItems.length === 0) return alert('Add at least one item to return')
    for (const item of sellerItems) {
      if (!item.quantity || item.quantity <= 0) return alert(`Enter quantity for ${item.product_name}`)
      if (!item.buying_rate || item.buying_rate <= 0) return alert(`Enter buying rate for ${item.product_name}`)
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/returns/seller', {
        seller_id: selectedSeller.id,
        location_id: Number(selectedLocation),
        reason: reason || null,
        items: sellerItems.map(i => ({
          product_id: i.product_id,
          batch_id: i.batch_id,
          quantity: i.quantity,
          buying_rate: i.buying_rate,
        })),
      })
      if (res.data.success) {
        alert(`Seller return processed: ${res.data.return_number}`)
        router.push('/client/inventory')
      } else {
        alert(res.data.message || 'Failed to process return')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Total ---
  const customerTotal = returnItems.reduce((s, i) => s + (i.quantity * i.selling_price), 0)
  const sellerTotal = sellerItems.reduce((s, i) => s + (i.quantity * i.buying_rate), 0)
  const selectedLocationLabel = locations.find((l) => l.id === Number(selectedLocation))?.name || 'Select location'

  return (
    <div className="w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15">
      <Link href="/client/inventory" className="mb-6 flex items-center text-sm duration-200 hover:text-gray-500 sm:mb-8 sm:text-base">
        <IoMdArrowBack /> &nbsp; Back to inventory
      </Link>
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Returns Management</h1>
      <p className="mb-6 text-sm text-gray-400 sm:mb-10">Process customer and supplier returns with inventory impact</p>

      {/* Return Type Toggle */}
      <div className="mx-auto mb-6 grid w-full max-w-5xl grid-cols-1 items-center gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-6">
        <div
          className={`flex w-full cursor-pointer items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 duration-150 hover:border-[#00A69B] sm:justify-center sm:gap-4 sm:px-0 sm:py-4 ${returnType === 'customer' ? 'border-[#008C83] bg-white' : 'border-gray-300 bg-white'}`}
          onClick={() => setReturnType('customer')}
        >
          <VscDebugRestart className={`text-4xl ${returnType === 'customer' ? 'text-[#008C83]' : 'text-gray-400'}`} />
          <div>
            <p className="text-base font-semibold sm:text-lg">Customer Returns</p>
            <p className="text-sm text-gray-400">Stock increases back into inventory</p>
          </div>
        </div>
        <div
          className={`flex w-full cursor-pointer items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 duration-150 hover:border-[#00A69B] sm:justify-center sm:gap-4 sm:px-0 sm:py-4 ${returnType === 'seller' ? 'border-[#008C83] bg-white' : 'border-gray-300 bg-white'}`}
          onClick={() => setReturnType('seller')}
        >
          <FaBox className={`text-4xl ${returnType === 'seller' ? 'text-[#008C83]' : 'text-gray-400'}`} />
          <div>
            <p className="text-base font-semibold sm:text-lg">Supplier Returns</p>
            <p className="text-sm text-gray-400">Stock decreases, returned to supplier</p>
          </div>
        </div>
      </div>

      {/* ============ CUSTOMER RETURN ============ */}
      {returnType === 'customer' && (
        <div ref={locationDropdownRef} className="mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-lg bg-white p-4 sm:gap-6 sm:px-7 sm:py-6">
          <h2 className="font-semibold flex items-center gap-2">
            <FaFileAlt className="text-[#008C83] text-xl" /> Customer Return Details
          </h2>

          {/* Location */}
          {locations.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Return stock to location *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdown((prev) => (prev === 'customer' ? null : 'customer'))}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm"
                >
                  <span>{selectedLocationLabel}</span>
                  <span className="text-xs text-gray-500">▼</span>
                </button>
                {locationDropdown === 'customer' && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(l.id)
                          setLocationDropdown(null)
                        }}
                        className="w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0"
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product search + barcode scan */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Add Product</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11">
                  <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={cProductSearch}
                    onChange={(e) => handleCProductSearch(e.target.value)}
                    onFocus={() => cProductSearch && setCShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setCShowProductDropdown(false), 300)}
                    placeholder="Search product by name, code, or barcode..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                {cShowProductDropdown && cProductResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {cProductResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onPointerDown={(e) => { e.preventDefault(); addReturnItem(p) }}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                      >
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <span className="text-gray-400 text-xs">₹{p.default_selling_price} / {p.unit || 'pcs'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 duration-150 hover:border-[#008C83] hover:bg-[#E6FFFD] sm:w-auto"
              >
                <MdQrCodeScanner className="text-lg text-[#008C83]" /> Scan
              </button>
            </div>
          </div>

          {/* Items table */}
          {returnItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Items to Return</label>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Qty</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Price (₹)</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Total</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 font-medium text-gray-700">{item.product_name}</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateReturnItemQty(index, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={item.selling_price}
                            onChange={(e) => updateReturnItemPrice(index, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">₹{(item.quantity * item.selling_price).toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => removeReturnItem(index)} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <IoClose className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer section (optional) */}
          <div className="border border-gray-200 rounded-lg">
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
              onClick={() => { if (selectedCustomer) clearCustomer(); }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Customer (Optional)</span>
                {!selectedCustomer && <span className="text-xs text-gray-400">— Skip for cash refund</span>}
              </div>
              {selectedCustomer && (
                <button type="button" onClick={clearCustomer} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">Clear</button>
              )}
            </div>
            <div className="px-4 py-3">
              {!selectedCustomer ? (
                <div className="relative">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-10">
                    <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onFocus={() => customerSearch && setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 300)}
                      placeholder="Search customer by name or phone..."
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                  {showCustomerDropdown && customers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {customers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onPointerDown={(e) => { e.preventDefault(); selectCustomer(c) }}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                        >
                          <span className="font-medium text-gray-700">{c.name}</span>
                          <span className="text-gray-400 text-xs">{c.phone || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-700">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && <p className="text-xs text-gray-400">{selectedCustomer.phone}</p>}
                    </div>
                    {customerDebtInfo && (
                      <div className="flex gap-3 text-xs">
                        {customerDebtInfo.total_debt > 0 && (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded font-medium">Debt: ₹{customerDebtInfo.total_debt.toFixed(2)}</span>
                        )}
                        {customerDebtInfo.advance_balance > 0 && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">Advance: ₹{customerDebtInfo.advance_balance.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Refund method */}
                  <label className="block text-xs font-medium text-gray-500 mb-2">Where should the refund go?</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                    <div
                      onClick={() => setRefundMethod('cash')}
                      className={`flex-1 py-2.5 text-center border rounded-lg cursor-pointer duration-150 text-sm font-medium ${
                        refundMethod === 'cash' ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]' : 'border-gray-200 text-gray-400'
                      }`}
                    >Cash Refund</div>
                    {customerDebtInfo && customerDebtInfo.total_debt > 0 && (
                      <div
                        onClick={() => setRefundMethod('debt_reduce')}
                        className={`flex-1 py-2.5 text-center border rounded-lg cursor-pointer duration-150 text-sm font-medium ${
                          refundMethod === 'debt_reduce' ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-400'
                        }`}
                      >Reduce Debt</div>
                    )}
                    <div
                      onClick={() => setRefundMethod('advance')}
                      className={`flex-1 py-2.5 text-center border rounded-lg cursor-pointer duration-150 text-sm font-medium ${
                        refundMethod === 'advance' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'
                      }`}
                    >Add to Advance</div>
                  </div>

                  {refundMethod === 'debt_reduce' && customerDebtInfo && customerTotal > customerDebtInfo.total_debt && (
                    <p className="text-xs text-orange-500 mt-2">
                      Refund (₹{customerTotal.toFixed(2)}) exceeds debt (₹{customerDebtInfo.total_debt.toFixed(2)}). Extra ₹{(customerTotal - customerDebtInfo.total_debt).toFixed(2)} will be saved as advance.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Reason for return</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#008C83] duration-200"
              placeholder="e.g., Defective product, wrong item..."
            />
          </div>

          {/* Total */}
          {customerTotal > 0 && (
            <div className="flex flex-col items-start gap-2 rounded-lg bg-[#E6FFFD] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-sm font-medium text-gray-600">Total refund amount</span>
                {!selectedCustomer && <span className="text-xs text-gray-400 ml-2">(Cash)</span>}
                {selectedCustomer && refundMethod === 'debt_reduce' && <span className="text-xs text-orange-500 ml-2">(Debt Reduction)</span>}
                {selectedCustomer && refundMethod === 'advance' && <span className="text-xs text-blue-500 ml-2">(Added to Advance)</span>}
                {selectedCustomer && refundMethod === 'cash' && <span className="text-xs text-gray-400 ml-2">(Cash)</span>}
              </div>
              <span className="text-lg font-bold text-[#008C83]">₹{customerTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="w-full h-px bg-gray-200"></div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/client/inventory" className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm duration-150 hover:bg-gray-100 sm:w-auto">
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleCustomerReturn}
              disabled={submitting || returnItems.length === 0}
              className="w-full cursor-pointer rounded-lg bg-[#008C83] px-6 py-2.5 text-sm font-medium text-white duration-200 hover:bg-[#007571] disabled:opacity-50 sm:w-auto"
            >
              {submitting ? 'Processing...' : `Process Return (${returnItems.length} items)`}
            </button>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onBarcodeScanned={handleBarcodeScan} />

      {/* ============ SELLER RETURN ============ */}
      {returnType === 'seller' && (
        <div ref={locationDropdownRef} className="mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-lg bg-white p-4 sm:gap-6 sm:px-7 sm:py-6">
          <h2 className="font-semibold flex items-center gap-2">
            <FaFileAlt className="text-[#008C83] text-xl" /> Supplier Return Details
          </h2>

          {/* Seller search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Supplier *</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11">
              <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={sellerSearch}
                onChange={(e) => handleSellerSearch(e.target.value)}
                onFocus={() => sellerSearch && setShowSellerDropdown(true)}
                onBlur={() => setTimeout(() => setShowSellerDropdown(false), 300)}
                placeholder="Search supplier by name or company..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {showSellerDropdown && sellers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {sellers.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); selectSeller(s) }}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                  >
                    <span className="font-medium text-gray-700">{s.name}</span>
                    <span className="text-gray-400 text-xs">{s.company_name || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          {locations.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Return stock from location *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdown((prev) => (prev === 'seller' ? null : 'seller'))}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm"
                >
                  <span>{selectedLocationLabel}</span>
                  <span className="text-xs text-gray-500">▼</span>
                </button>
                {locationDropdown === 'seller' && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(l.id)
                          setSellerItems([])
                          setSelectedProduct(null)
                          setProductSearch('')
                          setLocationDropdown(null)
                        }}
                        className="w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0"
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product search + batch selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Add product to return</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11">
              <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => handleProductSearch(e.target.value)}
                onFocus={() => productSearch && setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 300)}
                placeholder="Search product by name or code..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {showProductDropdown && productResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {productResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); selectProduct(p) }}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                  >
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <span className="text-gray-400 text-xs">Stock: {p.total_stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch selection for selected product */}
          {selectedProduct && batches.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Select batch for <span className="text-[#008C83]">{selectedProduct.name}</span></p>
              <div className="flex flex-col gap-2">
                {batches.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => addSellerItem(b)}
                    disabled={sellerItems.find(i => i.batch_id === b.id)}
                    className="text-left px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#008C83] duration-150 text-sm flex justify-between disabled:opacity-40 cursor-pointer"
                  >
                    <span>{b.batch_no || `Batch #${b.id}`}</span>
                    <span className="text-gray-400">Qty: {b.quantity_remaining} {b.expire_date ? `| Exp: ${b.expire_date}` : ''} | Rate: ₹{b.buying_rate || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedProduct && batches.length === 0 && (
            <p className="text-sm text-gray-400">No batches available at selected location</p>
          )}

          {/* Items table */}
          {sellerItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Items to return</label>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Batch</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Available</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Return Qty</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Rate (₹)</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerItems.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 font-medium text-gray-700">{item.product_name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{item.batch_no}</td>
                        <td className="px-4 py-2.5 text-gray-500">{item.max_qty}</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            max={item.max_qty}
                            value={item.quantity}
                            onChange={(e) => updateSellerItemQty(index, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={item.buying_rate}
                            onChange={(e) => updateSellerItemRate(index, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => removeSellerItem(index)} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <IoClose className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Reason for return</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#008C83] duration-200"
              placeholder="e.g., Quality issue, wrong shipment..."
            />
          </div>

          {/* Total */}
          {sellerTotal > 0 && (
            <div className="flex flex-col items-start gap-2 rounded-lg bg-[#E6FFFD] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-gray-600">Total return value</span>
              <span className="text-lg font-bold text-[#008C83]">₹{sellerTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="w-full h-px bg-gray-200"></div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/client/inventory" className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm duration-150 hover:bg-gray-100 sm:w-auto">
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSellerReturn}
              disabled={submitting || sellerItems.length === 0}
              className="w-full cursor-pointer rounded-lg bg-[#008C83] px-6 py-2.5 text-sm font-medium text-white duration-200 hover:bg-[#007571] disabled:opacity-50 sm:w-auto"
            >
              {submitting ? 'Processing...' : `Process Supplier Return (${sellerItems.length} items)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Return



