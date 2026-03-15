'use client'
import { useState, useEffect, useRef } from 'react'
import { IoMdArrowBack } from 'react-icons/io'
import { FaRegTrashCan } from 'react-icons/fa6'
import { FaRegClock } from 'react-icons/fa'
import { IoWarningOutline, IoShieldOutline } from 'react-icons/io5'
import { HiMiniMagnifyingGlass } from 'react-icons/hi2'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/util/api'

const REASONS = [
  { key: 'expired', label: 'Expired', icon: <FaRegClock />, color: 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' },
  { key: 'damaged', label: 'Damaged', icon: <IoWarningOutline />, color: 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' },
  { key: 'lost', label: 'Lost / Theft', icon: <IoShieldOutline />, color: 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' },
]

const Reduce = () => {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batches, setBatches] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [reason, setReason] = useState('expired')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const searchTimeout = useRef(null)
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
      if (!locationDropdownRef.current.contains(event.target)) setLocationDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

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
    setShowDropdown(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchProducts(value), 300)
  }

  const selectProduct = async (product) => {
    setSelectedProduct(product)
    setProductSearch(product.name)
    setShowDropdown(false)
    setProductResults([])
    setSelectedBatch(null)
    setQuantity('')

    try {
      const url = selectedLocation
        ? `/api/inventory/product/${product.id}?location_id=${selectedLocation}`
        : `/api/inventory/product/${product.id}`
      const res = await api.get(url)
      if (res.data.success) {
        setBatches(res.data.batches)
        if (res.data.batches.length > 0) setSelectedBatch(res.data.batches[0])
      }
    } catch (err) { console.error(err) }
  }

  const handleBatchChange = (batchId) => {
    const batch = batches.find(b => b.id === Number(batchId))
    setSelectedBatch(batch || null)
    setQuantity('')
  }

  const handleSubmit = async () => {
    if (submitting) return
    if (!selectedBatch) return alert('Select a product and batch')
    if (!quantity || Number(quantity) <= 0) return alert('Enter valid quantity')
    const actualQty = isWeight ? Number(quantity) / 1000 : Number(quantity)
    if (actualQty > selectedBatch.quantity_remaining) return alert(`Maximum available: ${isWeight ? Math.round(selectedBatch.quantity_remaining * 1000) : selectedBatch.quantity_remaining}`)

    setSubmitting(true)
    try {
      const res = await api.post('/api/disposal', {
        batch_id: selectedBatch.id,
        quantity: actualQty,
        disposal_method: reason,
        notes: notes || null,
      })
      if (res.data.success) {
        alert('Stock reduced successfully')
        router.push('/client/inventory')
      } else {
        alert(res.data.message || 'Failed to reduce stock')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reduce stock')
    } finally {
      setSubmitting(false)
    }
  }

  const WEIGHT_UNITS = ['kg', 'g', 'gram', 'grams', 'ml', 'ltr', 'l', 'litre', 'liter']
  const isWeight = selectedProduct && WEIGHT_UNITS.includes((selectedProduct.unit || '').toLowerCase())
  const isVolume = selectedProduct && ['ml', 'ltr', 'l', 'litre', 'liter'].includes((selectedProduct.unit || '').toLowerCase())
  const displayUnit = isVolume ? 'ml' : isWeight ? 'g' : (selectedProduct?.unit || 'pcs')

  const totalStock = selectedProduct
    ? batches.reduce((s, b) => s + b.quantity_remaining, 0)
    : 0

  const selectedLocationLabel = locations.find((l) => l.id === Number(selectedLocation))?.name || 'Select location'

  return (
    <div className="w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15">
      <Link href="/client/inventory" className="mb-6 flex items-center text-sm duration-200 hover:text-gray-500 sm:mb-8 sm:text-base">
        <IoMdArrowBack /> &nbsp; Back to inventory
      </Link>
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Stock Reduction</h1>
      <p className="mb-6 text-sm text-gray-400 sm:mb-10">Record non-sale stock reduction (expiry, damage, loss)</p>

      {/* Warning */}
      <div className="mx-auto mb-6 flex w-full max-w-4xl items-start justify-start gap-3 rounded-lg border border-[#FFE4D6] bg-[#FFF9F5] p-4 text-[#D84315] sm:mb-10 sm:items-center sm:gap-4 sm:p-5">
        <FaRegTrashCan className="shrink-0 text-lg" />
        <span>
          <h2 className="font-semibold">Caution: Stock reduction</h2>
          <p className="text-sm opacity-80">This action will permanently reduce stock. All adjustments are logged and will appear in loss reports.</p>
        </span>
      </div>

      {/* Form */}
      <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col gap-5 rounded-lg bg-white p-4 sm:gap-6 sm:p-6">
        {/* Location */}
        {locations.length > 1 && (
          <div ref={locationDropdownRef}>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Location</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm"
              >
                <span>{selectedLocationLabel}</span>
                <span className="text-xs text-gray-500">▼</span>
              </button>
              {locationDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {locations.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(l.id)
                        setSelectedProduct(null)
                        setProductSearch('')
                        setBatches([])
                        setSelectedBatch(null)
                        setLocationDropdownOpen(false)
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

        {/* Product search */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Select product *</label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3">
            <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              onFocus={() => productSearch && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
              placeholder="Search by name or code..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {showDropdown && productResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {productResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); selectProduct(p) }}
                  className="flex w-full cursor-pointer justify-between border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#FFF9F5] last:border-0"
                >
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-xs text-gray-400">Stock: {p.total_stock}</span>
                </button>
              ))}
            </div>
          )}
          {selectedProduct && (
            <p className="mt-2 text-sm text-gray-400">
              Total stock: <span className="font-medium text-gray-600">{isWeight ? `${(totalStock * 1000).toFixed(0)} ${displayUnit}` : `${totalStock} ${selectedProduct.unit || 'pcs'}`}</span>
            </p>
          )}
        </div>

        {/* Batch selection */}
        {batches.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Select batch</label>
            <select
              value={selectedBatch?.id || ''}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-[#008C83] focus:outline-none"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batch_no || `Batch #${b.id}`} - Qty: {b.quantity_remaining} {b.expire_date ? `| Exp: ${b.expire_date}` : ''} | {b.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">Reason for adjustment *</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {REASONS.map(r => (
              <div
                key={r.key}
                onClick={() => setReason(r.key)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border py-4 duration-150 sm:py-5 ${reason === r.key ? r.color : 'border-gray-200 text-gray-400'}`}
              >
                <span className="mb-1 text-xl">{r.icon}</span>
                <p className="text-sm font-medium">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Quantity to reduce *{isWeight ? ` (${displayUnit})` : ''}</label>
          <input
            type="number"
            min={1}
            max={isWeight ? Math.round((selectedBatch?.quantity_remaining || 0) * 1000) : (selectedBatch?.quantity_remaining || 0)}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm duration-200 focus:border-[#008C83] focus:outline-none"
            placeholder={isWeight ? `Enter ${displayUnit}` : 'Enter quantity'}
          />
          {selectedBatch && (
            <p className="mt-1 text-sm text-gray-400">Maximum available: {isWeight ? `${Math.round(selectedBatch.quantity_remaining * 1000)} ${displayUnit}` : `${selectedBatch.quantity_remaining} pcs`}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Additional notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none duration-200 focus:border-[#008C83]"
            placeholder="Optional"
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
            disabled={submitting || !selectedBatch || !quantity}
            className="w-full cursor-pointer rounded-lg bg-[#D84315] px-6 py-2.5 text-sm font-medium text-white duration-200 hover:bg-[#A6280B] disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Processing...' : 'Confirm Reduction'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reduce

