'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IoMdArrowBack } from "react-icons/io"
import Link from 'next/link'
import api, { getCurrentServerURL } from '@/util/api'

const Edit = () => {
    const params = useParams()
    const router = useRouter()
    const { id } = params
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const [oldImage, setOldImage] = useState(null)
    const fileRef = useRef(null)

    const [form, setForm] = useState({
        name: '', category_id: '', brand_id: '', unit: 'pcs',
        default_selling_price: '', default_buying_rate: '', minimum_stock_level: '',
        bulk_quantity: '', bulk_price: '', tax_percent: '',
        product_code: '', barcode: '', description: '', is_active: 1
    })

    useEffect(() => {
        fetchCategories()
        fetchBrands()
        fetchProduct()
    }, [id])

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories')
            if (res.data.success) setCategories(res.data.categories)
        } catch (err) {}
    }

    const fetchBrands = async () => {
        try {
            const res = await api.get('/api/brands')
            if (res.data.success) setBrands(res.data.brands)
        } catch (err) {}
    }

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/api/products/${id}`)
            if (res.data.success) {
                const p = res.data.product
                setForm({
                    name: p.name || '', category_id: p.category_id || '', brand_id: p.brand_id || '',
                    unit: p.unit || 'pcs', default_selling_price: p.default_selling_price || '',
                    default_buying_rate: p.default_buying_rate || '', minimum_stock_level: p.minimum_stock_level || '',
                    bulk_quantity: p.bulk_quantity || '', bulk_price: p.bulk_price || '',
                    tax_percent: p.tax_percent || '', product_code: p.product_code || '',
                    barcode: p.barcode || '', description: p.description || '', is_active: p.is_active
                })
                if (p.img_path) {
                    setOldImage(p.img_path)
                    const serverURL = getCurrentServerURL()
                    setImagePreview(`${serverURL}/api/products/image/${p.img_path}`)
                }
            }
        } catch (err) {
            alert('Product not found')
            router.push('/client/inventory')
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be under 5MB')
            return
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            alert('Only JPEG, PNG and WebP images are allowed')
            return
        }
        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name) return alert('Product name is required')

        setSubmitting(true)
        try {
            let img_path = oldImage
            if (imageFile) {
                if (oldImage) {
                    try { await api.delete(`/api/products/image/${oldImage}`) } catch (err) {}
                }
                const formData = new FormData()
                formData.append('image', imageFile)
                const imgRes = await api.post('/api/products/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (imgRes.data.success) img_path = imgRes.data.filename
            }

            const payload = {
                ...form,
                category_id: form.category_id || null,
                brand_id: form.brand_id || null,
                default_selling_price: parseFloat(form.default_selling_price) || 0,
                default_buying_rate: parseFloat(form.default_buying_rate) || 0,
                minimum_stock_level: parseInt(form.minimum_stock_level) || 0,
                bulk_quantity: parseInt(form.bulk_quantity) || null,
                bulk_price: parseFloat(form.bulk_price) || null,
                tax_percent: parseFloat(form.tax_percent) || 0,
                img_path
            }

            const res = await api.put(`/api/products/${id}`, payload)
            if (res.data.success) {
                alert('Product updated successfully!')
                router.push(`/client/inventory/${id}/view`)
            } else {
                alert(res.data.message || 'Failed to update product')
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update product')
        } finally {
            setSubmitting(false)
        }
    }

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    if (loading) return <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD] flex items-center justify-center'><p className='text-gray-500'>Loading...</p></div>

    return (
        <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-10'>Edit Product</h1>

            <div className='w-[70%] mx-auto rounded-xl bg-white p-6'>
                <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                    <div className='flex flex-col items-center gap-4'>
                        <p className='text-lg font-bold mb-4 mr-auto'>Product image</p>
                        <div className='flex items-center justify-start w-full'>
                            <div className='w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm overflow-hidden'>
                                {imagePreview ? <img src={imagePreview} alt="Preview" className='w-full h-full object-cover' /> : 'Preview'}
                            </div>
                            <div className='ml-6 flex flex-col gap-2'>
                                <button type='button' onClick={() => fileRef.current?.click()} className='px-4 py-2 rounded-lg text-[#008C83] border border-[#008C83] hover:bg-[#E6FFFD] duration-200 cursor-pointer'>Change Image</button>
                                <p className='text-xs text-gray-400'>Max 5MB. JPEG, PNG, WebP</p>
                            </div>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className='hidden' onChange={handleImageChange} />
                        </div>
                    </div>

                    <div className='flex flex-col gap-6'>
                        <p className='text-lg font-bold mb-4 mr-auto'>Basic information</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Product Name*</label>
                            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tata salt 1KG" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Category</label>
                            <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className='px-4 py-2 border border-gray-300 rounded-lg bg-white'>
                                <option value="">Select category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Brand (optional)</label>
                            <select value={form.brand_id} onChange={(e) => update('brand_id', e.target.value)} className='px-4 py-2 border border-gray-300 rounded-lg bg-white'>
                                <option value="">Select brand</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </span>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>

                        <p className='text-lg font-bold mb-4 mr-auto'>Product configuration</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Unit*</label>
                            <select value={form.unit} onChange={(e) => update('unit', e.target.value)} className='px-4 py-2 border border-gray-300 rounded-lg bg-white'>
                                <option value="pcs">pcs</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="liter">liter</option>
                                <option value="ml">ml</option>
                                <option value="dozen">dozen</option>
                                <option value="box">box</option>
                                <option value="pack">pack</option>
                            </select>
                        </span>
                        <div className='w-full flex gap-3 items-center'>
                            <span className='flex flex-col gap-2 w-full'>
                                <label className='text-sm font-light'>Buying Price</label>
                                <input type="number" step="0.01" value={form.default_buying_rate} onChange={(e) => update('default_buying_rate', e.target.value)} placeholder="₹ 18" className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                            <span className='flex flex-col gap-2 w-full'>
                                <label className='text-sm font-light'>Selling Price*</label>
                                <input type="number" step="0.01" value={form.default_selling_price} onChange={(e) => update('default_selling_price', e.target.value)} placeholder="₹ 22" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                        </div>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Minimum stock level</label>
                            <input type="number" value={form.minimum_stock_level} onChange={(e) => update('minimum_stock_level', e.target.value)} placeholder="20" className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <div className='w-full flex gap-3 items-center'>
                            <span className='flex flex-col gap-2 w-full'>
                                <label className='text-sm font-light'>Bulk quantity</label>
                                <input type="number" value={form.bulk_quantity} onChange={(e) => update('bulk_quantity', e.target.value)} placeholder="20" className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                            <span className='flex flex-col gap-2 w-full'>
                                <label className='text-sm font-light'>Bulk price</label>
                                <input type="number" step="0.01" value={form.bulk_price} onChange={(e) => update('bulk_price', e.target.value)} placeholder="₹ 17" className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                        </div>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Tax %</label>
                            <input type="number" step="0.01" value={form.tax_percent} onChange={(e) => update('tax_percent', e.target.value)} placeholder="5" className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>

                        <p className='text-lg font-bold mb-4 mr-auto'>System information</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Product code</label>
                            <input value={form.product_code} disabled className='px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed' />
                            <p className='text-xs text-gray-400 -mt-1'>Cannot be edited</p>
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Barcode</label>
                            <input value={form.barcode} onChange={(e) => update('barcode', e.target.value)} placeholder="9876543210123" className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label className='text-sm font-light'>Description</label>
                            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Product description..." rows={3} className='px-4 py-2 border border-gray-300 rounded-lg resize-none' />
                        </span>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>
                        <div className='w-full flex items-center justify-between'>
                            <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>Cancel</Link>
                            <button type='submit' disabled={submitting} className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200 disabled:opacity-50 cursor-pointer'>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Edit