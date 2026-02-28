'use client'
import { useState, useEffect, useRef } from 'react'
import { IoMdArrowBack } from 'react-icons/io'
import { FaBox, FaStore } from 'react-icons/fa'
import { FaArrowRight } from 'react-icons/fa6'
import { HiMiniMagnifyingGlass } from 'react-icons/hi2'
import { FiTrash2 } from 'react-icons/fi'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/util/api'

const Transfer = () => {
  const router = useRouter()
  const [locations, setLocations] = useState([])
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [items, setItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [locationDropdown, setLocationDropdown] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const searchTimeout = useRef(null)
  const locationDropdownRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/locations')
        if (res.data.success) {
          setLocations(res.data.locations)
          if (res.data.locations.length >= 2) {
            const storage = res.data.locations.find(l => l.location_type === 'storage')
            const shop = res.data.locations.find(l => l.location_type === 'shop' || l.location_type === 'store')
            if (storage && shop) {
              setFromLocation(storage.id)
              setToLocation(shop.id)
            } else {
              setFromLocation(res.data.locations[0].id)
              setToLocation(res.data.locations[1].id)
            }
          }
        }
      } catch (err) { console.error(err) }
    }
    load()
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!locationDropdownRef.current) return
      if (!locationDropdownRef.current.contains(event.target)) setLocationDropdown(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const searchProducts = async (query) => {
    if (!query.trim() || !fromLocation) return setProductResults([])
    try {
      const res = await api.get(`/api/products?search=${encodeURIComponent(query)}&location_id=${fromLocation}`)
      if (res.data.success) setProductResults(res.data.products.filter(p => p.total_stock > 0))
    } catch (err) { console.error(err) }
  }

  const handleProductSearch = (value) => {
    setProductSearch(value)
    setShowDropdown(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchProducts(value), 300)
  }

  const selectProduct = async (product) => {
    // Load batches at from_location for this product
    try {
      const res = await api.get(`/api/inventory/product/${product.id}?location_id=${fromLocation}`)
      if (res.data.success && res.data.batches.length > 0) {
        const batch = res.data.batches.find(b => b.quantity_remaining > 0)
        if (batch) {
          const existing = items.find(i => i.from_batch_id === batch.id)
          if (!existing) {
            setItems(prev => [...prev, {
              product_id: product.id,
              product_name: product.name,
              product_code: product.product_code,
              from_batch_id: batch.id,
              batch_no: batch.batch_no || `B-${batch.id}`,
              available: batch.quantity_remaining,
              quantity: 1,
              batches: res.data.batches.filter(b => b.quantity_remaining > 0),
            }])
          }
        }
      }
    } catch (err) { console.error(err) }
    setProductSearch('')
    setShowDropdown(false)
    setProductResults([])
  }

  const updateItemBatch = (index, batchId) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const batch = item.batches.find(b => b.id === Number(batchId))
      if (!batch) return item
      return { ...item, from_batch_id: batch.id, batch_no: batch.batch_no || `B-${batch.id}`, available: batch.quantity_remaining, quantity: Math.min(item.quantity, batch.quantity_remaining) }
    }))
  }

  const updateItemQuantity = (index, qty) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const val = Math.max(1, Math.min(Number(qty) || 1, item.available))
      return { ...item, quantity: val }
    }))
  }

  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index))

  const swapLocations = () => {
    const temp = fromLocation
    setFromLocation(toLocation)
    setToLocation(temp)
    setItems([]) // Clear items since batches change
  }

  const handleSubmit = async () => {
    if (submitting) return
    if (!fromLocation || !toLocation) return alert('Select both locations')
    if (fromLocation === toLocation) return alert('Source and destination must be different')
    if (items.length === 0) return alert('Add at least one product')

    setSubmitting(true)
    try {
      const payload = {
        from_location_id: fromLocation,
        to_location_id: toLocation,
        notes: notes || null,
        items: items.map(item => ({
          from_batch_id: item.from_batch_id,
          quantity: item.quantity,
        }))
      }
      const res = await api.post('/api/transfers', payload)
      if (res.data.success) {
        alert(`Transfer completed! ${res.data.transfer_number}`)
        router.push('/client/inventory')
      } else {
        alert(res.data.message || 'Transfer failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  const fromLabel = locations.find((l) => l.id === Number(fromLocation))
    ? `${locations.find((l) => l.id === Number(fromLocation)).name} (${locations.find((l) => l.id === Number(fromLocation)).location_type})`
    : 'Select location'

  const toLabel = locations.find((l) => l.id === Number(toLocation))
    ? `${locations.find((l) => l.id === Number(toLocation)).name} (${locations.find((l) => l.id === Number(toLocation)).location_type})`
    : 'Select location'

  return (
    <div className="w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15">
      <Link href="/client/inventory" className="mb-6 flex items-center text-sm duration-200 hover:text-gray-500 sm:mb-8 sm:text-base">
        <IoMdArrowBack /> &nbsp; Back to inventory
      </Link>
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Stock Transfer</h1>
      <p className="mb-6 text-sm text-gray-400 sm:mb-10">Move stock between storage and shop floor</p>

      {/* Location cards */}
      <div ref={locationDropdownRef} className="mx-auto mb-6 grid w-full max-w-5xl grid-cols-1 items-center gap-3 sm:mb-10 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
        <div className="w-full rounded-lg border border-gray-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg bg-[#E3F2FD] p-3.5 text-lg text-[#2196F3]"><FaStore /></span>
            <span>
              <p className="text-lg font-semibold">From</p>
              <p className="text-sm text-gray-400">Source location</p>
            </span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationDropdown((prev) => (prev === 'from' ? null : 'from'))}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm"
            >
              <span>{fromLabel}</span>
              <span className="text-xs text-gray-500">▼</span>
            </button>
            {locationDropdown === 'from' && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setFromLocation(l.id)
                      setItems([])
                      setLocationDropdown(null)
                    }}
                    className="w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0"
                  >
                    {l.name} ({l.location_type})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="button" onClick={swapLocations} className="mx-auto rounded-full border border-gray-200 bg-white p-3 duration-150 hover:bg-gray-50 cursor-pointer">
          <FaArrowRight className="text-[#008C83]" />
        </button>

        <div className="w-full rounded-lg border border-gray-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg bg-[#E8F5E9] p-3.5 text-lg text-[#4CAF50]"><FaBox /></span>
            <span>
              <p className="text-lg font-semibold">To</p>
              <p className="text-sm text-gray-400">Destination location</p>
            </span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationDropdown((prev) => (prev === 'to' ? null : 'to'))}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm"
            >
              <span>{toLabel}</span>
              <span className="text-xs text-gray-500">▼</span>
            </button>
            {locationDropdown === 'to' && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setToLocation(l.id)
                      setLocationDropdown(null)
                    }}
                    className="w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0"
                  >
                    {l.name} ({l.location_type})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Details */}
      <div className="mx-auto mb-10 flex w-full max-w-5xl flex-col gap-5 rounded-lg bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Transfer Items</h2>

        {/* Product search */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Search product to add</label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3">
            <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              onFocus={() => productSearch && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
              placeholder="Type product name or code..."
              className="flex-1 bg-transparent text-sm outline-none"
              disabled={!fromLocation}
            />
          </div>
          {showDropdown && productResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {productResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); selectProduct(p) }}
                  className="flex w-full cursor-pointer justify-between border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0"
                >
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-xs text-gray-400">Stock: {p.total_stock} | {p.product_code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Batch</th>
                  <th className="px-4 py-3 text-left font-medium">Available</th>
                  <th className="px-4 py-3 text-left font-medium">Transfer Qty</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.product_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      {item.batches.length > 1 ? (
                        <select
                          value={item.from_batch_id}
                          onChange={(e) => updateItemBatch(idx, e.target.value)}
                          className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                        >
                          {item.batches.map(b => (
                            <option key={b.id} value={b.id}>{b.batch_no || `B-${b.id}`} (Qty: {b.quantity_remaining})</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-600">{item.batch_no}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.available}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={item.available}
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(idx, e.target.value)}
                        className="w-20 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-[#008C83] focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeItem(idx)} className="cursor-pointer p-1 text-gray-400 hover:text-red-500">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            Search and add products to transfer
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none duration-200 focus:border-[#008C83]"
            placeholder="Any additional notes..."
          />
        </div>

        <div className="mt-1 h-px w-full bg-gray-200"></div>
        <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/client/inventory" className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm duration-150 hover:bg-gray-100 sm:w-auto">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="w-full cursor-pointer rounded-lg bg-[#008C83] px-6 py-2.5 text-sm font-medium text-white duration-200 hover:bg-[#007571] disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Transferring...' : `Confirm Transfer (${items.length} item${items.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Transfer

