'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io"
import JsBarcode from 'jsbarcode'
import { FaBox } from 'react-icons/fa'
import { GoPencil } from "react-icons/go"
import { FiTrash2 } from "react-icons/fi"
import api, { getCurrentServerURL } from '@/util/api'

const View = () => {
    const params = useParams()
    const router = useRouter()
    const { id } = params
    const barcodeRef = useRef(null)
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchProduct()
    }, [id])

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/api/products/${id}`)
            if (res.data.success) setProduct(res.data.product)
        } catch (err) {
            alert('Product not found')
            router.push('/client/inventory')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (product && barcodeRef.current && (product.barcode || product.product_code)) {
            try {
                JsBarcode(barcodeRef.current, product.barcode || product.product_code, {
                    format: "CODE128",
                    width: 2,
                    height: 70,
                    displayValue: false,
                    fontSize: 16,
                    margin: 10
                })
            } catch (e) {}
        }
    }, [product])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to deactivate this product?')) return
        setDeleting(true)
        try {
            const res = await api.delete(`/api/products/${id}`)
            if (res.data.success) {
                alert('Product deactivated')
                router.push('/client/inventory')
            } else {
                alert(res.data.message)
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete product')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) return <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD] flex items-center justify-center'><p className='text-gray-500'>Loading...</p></div>
    if (!product) return null

    const serverURL = getCurrentServerURL()
    const imageUrl = product.img_path ? `${serverURL}/api/products/image/${product.img_path}` : null

    return (
        <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <div className='flex items-center justify-between mb-10'>
                <h1 className='text-3xl font-bold'>Product Details</h1>
                <div className='flex gap-3'>
                    <Link href={`/client/inventory/${id}/edit`} className='flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 duration-200'>
                        <GoPencil /> Edit
                    </Link>
                    <button onClick={handleDelete} disabled={deleting} className='flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 duration-200 cursor-pointer disabled:opacity-50'>
                        <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            <div className='w-[75%] mx-auto rounded-xl bg-white p-6 flex flex-col gap-6'>
                {imageUrl && (
                    <div className='flex items-center gap-6 mb-2'>
                        <img src={imageUrl} alt={product.name} className='w-32 h-32 object-cover rounded-lg' />
                    </div>
                )}
                <h2 className='font-bold text-xl mb-2'>Basic Information</h2>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Product name</p>
                        <p className='font-semibold text-md'>{product.name}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Product code</p>
                        <p className='text-md'>{product.product_code}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Category</p>
                        <p className='text-md'>{product.category_name || '—'}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Brand</p>
                        <p className='text-md'>{product.brand_name || '—'}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Unit</p>
                        <p className='text-md'>{product.unit}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Selling price</p>
                        <p className='font-semibold text-md text-green-400'>₹ {product.default_selling_price}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Buying price</p>
                        <p className='text-md'>₹ {product.default_buying_rate}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Tax</p>
                        <p className='text-md'>{product.tax_percent}%</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Bulk quantity</p>
                        <p className='text-md'>{product.bulk_quantity || '—'}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Bulk price</p>
                        <p className='font-semibold text-md text-green-400'>{product.bulk_price ? `₹ ${product.bulk_price}` : '—'}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Minimum stock level</p>
                        <p className='text-md'>{product.minimum_stock_level}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Barcode</p>
                        <p className='text-md'>{product.barcode || '—'}</p>
                    </span>
                </div>
                {product.description && (
                    <div className='w-full'>
                        <p className='text-gray-400 text-sm'>Description</p>
                        <p className='text-md'>{product.description}</p>
                    </div>
                )}

                <hr />
                <div>
                    <h2 className='font-bold text-xl mb-4'>Barcode</h2>
                    <span className='w-full flex justify-start items-center bg-gray-50 p-8 rounded-lg'>
                        <svg ref={barcodeRef}></svg>
                        <p className='ml-4 font-bold text-xl'>{product.barcode || product.product_code}</p>
                    </span>
                </div>
            </div>

            <div className='w-[75%] mx-auto mt-10 rounded-xl bg-white p-6 flex flex-col gap-6'>
                <h2 className='font-bold text-xl mb-4'>Stock Summary</h2>
                <div className='w-full flex gap-4'>
                    {product.stock_by_location && product.stock_by_location.length > 0 ? (
                        product.stock_by_location.map((loc, i) => (
                            <div key={loc.location_id} className={`flex-1 flex flex-col items-start gap-2 ${i % 3 === 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : i % 3 === 1 ? 'bg-[#E3F2FD] text-[#1976D2]' : 'bg-[#E0F2F1] text-[#00796B]'} p-6 rounded-lg`}>
                                <span className='flex items-center text-md gap-2 font-light'><FaBox /> {loc.location_name}</span>
                                <p className='font-bold text-xl'>{loc.stock} {product.unit}</p>
                            </div>
                        ))
                    ) : (
                        <div className='flex-1 flex flex-col items-start gap-2 bg-gray-50 text-gray-500 p-6 rounded-lg'>
                            <span className='flex items-center text-md gap-2 font-light'><FaBox /> No stock</span>
                            <p className='font-bold text-xl'>0 {product.unit}</p>
                        </div>
                    )}
                    <div className='flex-1 flex flex-col items-start gap-2 bg-[#E0F2F1] text-[#00796B] p-6 rounded-lg'>
                        <span className='flex items-center text-md gap-2 font-light'><FaBox /> Total stock</span>
                        <p className='font-bold text-xl'>{product.total_stock || 0} {product.unit}</p>
                    </div>
                </div>
            </div>

            {product.batches && product.batches.length > 0 && (
                <div className='w-[75%] mx-auto mt-10 rounded-xl bg-white p-6 flex flex-col gap-4'>
                    <h2 className='font-bold text-xl mb-2'>Active Batches</h2>
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='text-left p-3 text-sm font-semibold'>Batch No</th>
                                <th className='text-left p-3 text-sm font-semibold'>Location</th>
                                <th className='text-left p-3 text-sm font-semibold'>Remaining</th>
                                <th className='text-left p-3 text-sm font-semibold'>Rate</th>
                                <th className='text-left p-3 text-sm font-semibold'>Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.batches.map(b => (
                                <tr key={b.id} className='border-t hover:bg-gray-50 duration-150'>
                                    <td className='p-3 text-sm'>{b.batch_no}</td>
                                    <td className='p-3 text-sm'>{b.location_name}</td>
                                    <td className='p-3 text-sm'>{b.quantity_remaining} / {b.quantity_initial}</td>
                                    <td className='p-3 text-sm'>₹{b.buying_rate}</td>
                                    <td className='p-3 text-sm'>{b.expire_date || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default View