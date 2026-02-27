'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IoMdArrowBack } from 'react-icons/io'
import { HiOutlineQrCode } from 'react-icons/hi2'
import Link from 'next/link'
import Image from 'next/image'
import api, { getCurrentServerURL } from '@/util/api'
import BarcodeScanner from '@/component/BarcodeScanner'

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
    const [scannerOpen, setScannerOpen] = useState(false)

    const [form, setForm] = useState({
        name: '', category_id: '', brand_id: '', unit: 'pcs',
        default_selling_price: '', default_buying_rate: '', minimum_stock_level: '',
        bulk_quantity: '', bulk_price: '', tax_percent: '',
        product_code: '', barcode: '', description: '', is_active: 1,
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
                    barcode: p.barcode || '', description: p.description || '', is_active: p.is_active,
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
                    headers: { 'Content-Type': 'multipart/form-data' },
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
                img_path,
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

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

    if (loading) {
        return (
            <div className='flex w-full min-h-screen items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15'>
                <p className='text-gray-500'>Loading...</p>
            </div>
        )
    }

    return (
        <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15'>
            <Link href='/client/inventory' className='mb-6 flex items-center text-sm duration-200 hover:text-gray-500 sm:mb-8 sm:text-base'>
                <IoMdArrowBack /> &nbsp; Back to inventory
            </Link>
            <h1 className='mb-6 text-2xl font-bold sm:mb-10 sm:text-3xl'>Edit Product</h1>

            <div className='mx-auto w-full max-w-5xl rounded-xl bg-white p-4 sm:p-6'>
                <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                    <div className='flex flex-col gap-4'>
                        <p className='mr-auto mb-1 text-lg font-bold sm:mb-4'>Product image</p>
                        <div className='flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-start'>
                            <div className='flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-sm text-gray-400 sm:h-32 sm:w-32'>
                                {imagePreview ? <Image src={imagePreview} alt='Preview' width={128} height={128} unoptimized className='h-full w-full object-cover' /> : 'Preview'}
                            </div>
                            <div className='flex flex-col gap-2 sm:ml-2'>
                                <button type='button' onClick={() => fileRef.current?.click()} className='cursor-pointer rounded-lg border border-[#008C83] px-4 py-2 text-[#008C83] duration-200 hover:bg-[#E6FFFD]'>Change Image</button>
                                <p className='text-xs text-gray-400'>Max 5MB. JPEG, PNG, WebP</p>
                            </div>
                            <input ref={fileRef} type='file' accept='image/jpeg,image/png,image/webp' className='hidden' onChange={handleImageChange} />
                        </div>
                    </div>

                    <div className='flex flex-col gap-6'>
                        <p className='mr-auto mb-1 text-lg font-bold sm:mb-4'>Basic information</p>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Product Name*</label>
                            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder='Tata salt 1KG' required className='rounded-lg border border-gray-300 px-4 py-2' />
                        </span>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Category</label>
                            <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className='rounded-lg border border-gray-300 bg-white px-4 py-2'>
                                <option value=''>Select category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </span>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Brand (optional)</label>
                            <select value={form.brand_id} onChange={(e) => update('brand_id', e.target.value)} className='rounded-lg border border-gray-300 bg-white px-4 py-2'>
                                <option value=''>Select brand</option>
                                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </span>

                        <div className='my-2 h-px w-full rounded bg-gray-200'></div>

                        <p className='mr-auto mb-1 text-lg font-bold sm:mb-4'>Product configuration</p>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Unit*</label>
                            <select value={form.unit} onChange={(e) => update('unit', e.target.value)} className='rounded-lg border border-gray-300 bg-white px-4 py-2'>
                                <option value='pcs'>pcs</option>
                                <option value='kg'>kg</option>
                                <option value='g'>g</option>
                                <option value='liter'>liter</option>
                                <option value='ml'>ml</option>
                                <option value='dozen'>dozen</option>
                                <option value='box'>box</option>
                                <option value='pack'>pack</option>
                            </select>
                        </span>
                        <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center'>
                            <span className='flex w-full flex-col gap-2'>
                                <label className='text-sm font-light'>Buying Price</label>
                                <input type='number' step='0.01' value={form.default_buying_rate} onChange={(e) => update('default_buying_rate', e.target.value)} placeholder='Rs 18' className='rounded-lg border border-gray-300 px-4 py-2' />
                            </span>
                            <span className='flex w-full flex-col gap-2'>
                                <label className='text-sm font-light'>Selling Price*</label>
                                <input type='number' step='0.01' value={form.default_selling_price} onChange={(e) => update('default_selling_price', e.target.value)} placeholder='Rs 22' required className='rounded-lg border border-gray-300 px-4 py-2' />
                            </span>
                        </div>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Minimum stock level</label>
                            <input type='number' value={form.minimum_stock_level} onChange={(e) => update('minimum_stock_level', e.target.value)} placeholder='20' className='rounded-lg border border-gray-300 px-4 py-2' />
                        </span>
                        <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center'>
                            <span className='flex w-full flex-col gap-2'>
                                <label className='text-sm font-light'>Bulk quantity</label>
                                <input type='number' value={form.bulk_quantity} onChange={(e) => update('bulk_quantity', e.target.value)} placeholder='20' className='rounded-lg border border-gray-300 px-4 py-2' />
                            </span>
                            <span className='flex w-full flex-col gap-2'>
                                <label className='text-sm font-light'>Bulk price</label>
                                <input type='number' step='0.01' value={form.bulk_price} onChange={(e) => update('bulk_price', e.target.value)} placeholder='Rs 17' className='rounded-lg border border-gray-300 px-4 py-2' />
                            </span>
                        </div>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Tax %</label>
                            <input type='number' step='0.01' value={form.tax_percent} onChange={(e) => update('tax_percent', e.target.value)} placeholder='5' className='rounded-lg border border-gray-300 px-4 py-2' />
                        </span>

                        <div className='my-2 h-px w-full rounded bg-gray-200'></div>

                        <p className='mr-auto mb-1 text-lg font-bold sm:mb-4'>System information</p>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Product code</label>
                            <input value={form.product_code} disabled className='cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500' />
                            <p className='-mt-1 text-xs text-gray-400'>Cannot be edited</p>
                        </span>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Barcode</label>
                            <div className='flex gap-2'>
                                <input value={form.barcode} onChange={(e) => update('barcode', e.target.value)} placeholder='9876543210123' className='flex-1 rounded-lg border border-gray-300 px-4 py-2' />
                                <button type='button' onClick={() => setScannerOpen(true)} className='cursor-pointer rounded-lg border border-[#008C83] px-3 py-2 text-[#008C83] duration-150 hover:bg-[#E6FFFD]'>
                                    <HiOutlineQrCode className='h-5 w-5' />
                                </button>
                            </div>
                        </span>
                        <span className='flex w-full flex-col gap-2'>
                            <label className='text-sm font-light'>Description</label>
                            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder='Product description...' rows={3} className='resize-none rounded-lg border border-gray-300 px-4 py-2' />
                        </span>

                        <div className='my-2 h-px w-full rounded bg-gray-200'></div>
                        <div className='flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
                            <Link href='/client/inventory' className='w-full rounded-lg border border-gray-300 px-6 py-2 text-center duration-150 hover:bg-gray-100 sm:w-auto'>Cancel</Link>
                            <button type='submit' disabled={submitting} className='w-full cursor-pointer rounded-lg bg-[#008C83] px-6 py-2 text-white duration-200 hover:bg-[#007571] disabled:opacity-50 sm:w-auto'>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <BarcodeScanner
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onBarcodeScanned={(code, cb) => {
                    update('barcode', code)
                    setScannerOpen(false)
                    cb(true, 'Barcode set: ' + code)
                }}
            />
        </div>
    )
}

export default Edit
