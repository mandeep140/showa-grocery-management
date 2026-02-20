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
  const searchTimeout = useRef(null)

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
    if (Number(quantity) > selectedBatch.quantity_remaining) return alert(`Maximum available: ${selectedBatch.quantity_remaining}`)

    setSubmitting(true)
    try {
      const res = await api.post('/api/disposal', {
        batch_id: selectedBatch.id,
        quantity: Number(quantity),
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

  const totalStock = selectedProduct
    ? batches.reduce((s, b) => s + b.quantity_remaining, 0)
    : 0

  return (
    <div className="w-full min-h-screen px-15 py-20 bg-[#E6FFFD]">
      <Link href="/client/inventory" className="flex items-center mb-8 hover:text-gray-500 duration-200">
        <IoMdArrowBack /> &nbsp; Back to inventory
      </Link>
      <h1 className="text-3xl font-bold mb-2">Stock Reduction</h1>
      <p className="text-sm text-gray-400 mb-10">Record non-sale stock reduction (expiry, damage, loss)</p>

      {/* Warning */}
      <div className="w-[80%] mx-auto flex gap-4 items-center justify-start mb-10 p-5 bg-[#FFF9F5] border border-[#FFE4D6] text-[#D84315] rounded-lg">
        <FaRegTrashCan className="text-lg shrink-0" />
        <span>
          <h2 className="font-semibold">Caution: Stock reduction</h2>
          <p className="text-sm opacity-80">This action will permanently reduce stock. All adjustments are logged and will appear in loss reports.</p>
        </span>
      </div>

      {/* Form */}
      <div className="w-[80%] mx-auto flex flex-col gap-6 p-6 bg-white rounded-lg mb-10">
        {/* Location */}
        {locations.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(Number(e.target.value)); setSelectedProduct(null); setProductSearch(''); setBatches([]); setSelectedBatch(null) }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#008C83]"
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Product search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Select product *</label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11">
            <HiMiniMagnifyingGlass className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              onFocus={() => productSearch && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search by name or code..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {showDropdown && productResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {productResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => selectProduct(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#FFF9F5] text-sm border-b border-gray-50 last:border-0 flex justify-between cursor-pointer"
                >
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-gray-400 text-xs">Stock: {p.total_stock}</span>
                </button>
              ))}
            </div>
          )}
          {selectedProduct && (
            <p className="text-sm text-gray-400 mt-2">
              Total stock: <span className="font-medium text-gray-600">{totalStock} {selectedProduct.unit || 'pcs'}</span>
            </p>
          )}
        </div>

        {/* Batch selection */}
        {batches.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Select batch</label>
            <select
              value={selectedBatch?.id || ''}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#008C83]"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batch_no || `Batch #${b.id}`} — Qty: {b.quantity_remaining} {b.expire_date ? `| Exp: ${b.expire_date}` : ''} | {b.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Reason for adjustment *</label>
          <div className="flex gap-4">
            {REASONS.map(r => (
              <div
                key={r.key}
                onClick={() => setReason(r.key)}
                className={`w-1/3 flex flex-col justify-center items-center border py-5 rounded-lg cursor-pointer duration-150 ${reason === r.key ? r.color : 'text-gray-400 border-gray-200'}`}
              >
                <span className="text-xl mb-1">{r.icon}</span>
                <p className="text-sm font-medium">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Quantity to reduce *</label>
          <input
            type="number"
            min={1}
            max={selectedBatch?.quantity_remaining || 0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#008C83] duration-200"
            placeholder="Enter quantity"
          />
          {selectedBatch && (
            <p className="text-sm text-gray-400 mt-1">Maximum available: {selectedBatch.quantity_remaining} pcs</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Additional notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:border-[#008C83] duration-200"
            placeholder="Optional"
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
            disabled={submitting || !selectedBatch || !quantity}
            className="px-6 py-2.5 bg-[#D84315] text-white rounded-lg hover:bg-[#A6280B] duration-200 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Processing...' : 'Confirm Reduction'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reduce
