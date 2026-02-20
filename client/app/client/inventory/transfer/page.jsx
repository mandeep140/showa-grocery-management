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
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const searchTimeout = useRef(null)

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

  const fromName = locations.find(l => l.id === fromLocation)?.name || '—'
  const toName = locations.find(l => l.id === toLocation)?.name || '—'

  return (
    <div className="w-full min-h-screen px-15 py-20 bg-[#E6FFFD]">
      <Link href="/client/inventory" className="flex items-center mb-8 hover:text-gray-500 duration-200">
        <IoMdArrowBack /> &nbsp; Back to inventory
      </Link>
      <h1 className="text-3xl font-bold mb-2">Stock Transfer</h1>
      <p className="text-sm text-gray-400 mb-10">Move stock between storage and shop floor</p>

      {/* Location cards */}
      <div className="w-[80%] mx-auto flex gap-4 items-center mb-10">
        <div className="w-[45%] px-5 py-5 bg-white rounded-lg border border-gray-100">
          <div className="flex gap-3 items-center mb-3">
            <span className="p-3.5 bg-[#E3F2FD] rounded-lg text-lg text-[#2196F3]"><FaStore /></span>
            <span>
              <p className="font-semibold text-lg">From</p>
              <p className="text-sm text-gray-400">Source location</p>
            </span>
          </div>
          <select
            value={fromLocation}
            onChange={(e) => { setFromLocation(Number(e.target.value)); setItems([]) }}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#008C83]"
          >
            <option value="">Select location</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.location_type})</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={swapLocations} className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 duration-150 cursor-pointer">
          <FaArrowRight className="text-[#008C83]" />
        </button>

        <div className="w-[45%] px-5 py-5 bg-white rounded-lg border border-gray-100">
          <div className="flex gap-3 items-center mb-3">
            <span className="p-3.5 bg-[#E8F5E9] rounded-lg text-lg text-[#4CAF50]"><FaBox /></span>
            <span>
              <p className="font-semibold text-lg">To</p>
              <p className="text-sm text-gray-400">Destination location</p>
            </span>
          </div>
          <select
            value={toLocation}
            onChange={(e) => setToLocation(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#008C83]"
          >
            <option value="">Select location</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.location_type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transfer Details */}
      <div className="w-[80%] mx-auto flex flex-col gap-5 p-6 bg-white rounded-lg mb-10">
        <h2 className="text-lg font-semibold">Transfer Items</h2>

        {/* Product search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Search product to add</label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11">
            <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              onFocus={() => productSearch && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Type product name or code..."
              className="flex-1 bg-transparent text-sm outline-none"
              disabled={!fromLocation}
            />
          </div>
          {showDropdown && productResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {productResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => selectProduct(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#E6FFFD] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                >
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-gray-400 text-xs">Stock: {p.total_stock} | {p.product_code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 font-medium">Available</th>
                  <th className="text-left px-4 py-3 font-medium">Transfer Qty</th>
                  <th className="px-4 py-3 w-10"></th>
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
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-gray-50"
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
                        className="w-20 text-sm border border-gray-200 rounded px-2 py-1.5 bg-gray-50 focus:outline-none focus:border-[#008C83]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer">
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
          <div className="py-8 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            Search and add products to transfer
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:border-[#008C83] duration-200"
            placeholder="Any additional notes..."
          />
        </div>

        <div className="w-full h-px bg-gray-200 mt-1"></div>
        <div className="flex items-center justify-between mt-1">
          <Link href="/client/inventory" className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150 text-sm">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="px-6 py-2.5 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Transferring...' : `Confirm Transfer (${items.length} item${items.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Transfer
