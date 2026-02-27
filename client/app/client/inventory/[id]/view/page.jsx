'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IoMdArrowBack } from 'react-icons/io'
import JsBarcode from 'jsbarcode'
import { FaBox } from 'react-icons/fa'
import { GoPencil } from 'react-icons/go'
import { FiTrash2 } from 'react-icons/fi'
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
                    format: 'CODE128',
                    width: 2,
                    height: 70,
                    displayValue: false,
                    fontSize: 16,
                    margin: 10,
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

    if (loading) {
        return (
            <div className='flex min-h-screen w-full items-center justify-center bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15'>
                <p className='text-gray-500'>Loading...</p>
            </div>
        )
    }

    if (!product) return null

    const serverURL = getCurrentServerURL()
    const imageUrl = product.img_path ? `${serverURL}/api/products/image/${product.img_path}` : null

    return (
        <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15'>
            <Link href='/client/inventory' className='mb-6 flex items-center text-sm duration-200 hover:text-gray-500 sm:mb-8 sm:text-base'>
                <IoMdArrowBack /> &nbsp; Back to inventory
            </Link>

            <div className='mx-auto mb-6 flex w-full max-w-5xl flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between'>
                <h1 className='text-2xl font-bold sm:text-3xl'>Product Details</h1>
                <div className='grid grid-cols-2 gap-2 sm:flex sm:gap-3'>
                    <Link href={`/client/inventory/${id}/edit`} className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm duration-200 hover:bg-gray-50 sm:px-5'>
                        <GoPencil /> Edit
                    </Link>
                    <button onClick={handleDelete} disabled={deleting} className='flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm text-white duration-200 hover:bg-red-600 disabled:opacity-50 sm:px-5'>
                        <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            <div className='mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-xl bg-white p-4 sm:gap-6 sm:p-6'>
                {imageUrl && (
                    <div className='mb-1 flex items-center gap-4 sm:gap-6'>
                        <Image src={imageUrl} alt={product.name} width={128} height={128} unoptimized className='h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32' />
                    </div>
                )}

                <h2 className='mb-1 text-lg font-bold sm:text-xl'>Basic Information</h2>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                        <p className='text-sm text-gray-400'>Product name</p>
                        <p className='text-md font-semibold'>{product.name}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Product code</p>
                        <p className='text-md'>{product.product_code}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Category</p>
                        <p className='text-md'>{product.category_name || '-'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Brand</p>
                        <p className='text-md'>{product.brand_name || '-'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Unit</p>
                        <p className='text-md'>{product.unit}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Selling price</p>
                        <p className='text-md font-semibold text-green-500'>{`\u20B9 ${product.default_selling_price}`}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Buying price</p>
                        <p className='text-md'>{`\u20B9 ${product.default_buying_rate}`}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Tax</p>
                        <p className='text-md'>{product.tax_percent}%</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Bulk quantity</p>
                        <p className='text-md'>{product.bulk_quantity || '-'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Bulk price</p>
                        <p className='text-md font-semibold text-green-500'>{product.bulk_price ? `\u20B9 ${product.bulk_price}` : '-'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Minimum stock level</p>
                        <p className='text-md'>{product.minimum_stock_level}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-400'>Barcode</p>
                        <p className='text-md'>{product.barcode || '-'}</p>
                    </div>
                </div>

                {product.description && (
                    <div className='w-full'>
                        <p className='text-sm text-gray-400'>Description</p>
                        <p className='text-md'>{product.description}</p>
                    </div>
                )}

                <hr />

                <div>
                    <h2 className='mb-3 text-lg font-bold sm:mb-4 sm:text-xl'>Barcode</h2>
                    <span className='flex w-full flex-col items-start justify-start gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-8'>
                        <svg ref={barcodeRef}></svg>
                        <p className='text-lg font-bold sm:text-xl'>{product.barcode || product.product_code}</p>
                    </span>
                </div>
            </div>

            <div className='mx-auto mt-6 flex w-full max-w-5xl flex-col gap-4 rounded-xl bg-white p-4 sm:mt-10 sm:gap-6 sm:p-6'>
                <h2 className='mb-1 text-lg font-bold sm:mb-2 sm:text-xl'>Stock Summary</h2>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    {product.stock_by_location && product.stock_by_location.length > 0 ? (
                        product.stock_by_location.map((loc, i) => (
                            <div key={loc.location_id} className={`flex flex-col items-start gap-2 rounded-lg p-5 ${i % 3 === 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : i % 3 === 1 ? 'bg-[#E3F2FD] text-[#1976D2]' : 'bg-[#E0F2F1] text-[#00796B]'}`}>
                                <span className='flex items-center gap-2 text-sm font-light sm:text-md'><FaBox /> {loc.location_name}</span>
                                <p className='text-xl font-bold'>{loc.stock} {product.unit}</p>
                            </div>
                        ))
                    ) : (
                        <div className='flex flex-col items-start gap-2 rounded-lg bg-gray-50 p-5 text-gray-500'>
                            <span className='flex items-center gap-2 text-sm font-light sm:text-md'><FaBox /> No stock</span>
                            <p className='text-xl font-bold'>0 {product.unit}</p>
                        </div>
                    )}
                    <div className='flex flex-col items-start gap-2 rounded-lg bg-[#E0F2F1] p-5 text-[#00796B]'>
                        <span className='flex items-center gap-2 text-sm font-light sm:text-md'><FaBox /> Total stock</span>
                        <p className='text-xl font-bold'>{product.total_stock || 0} {product.unit}</p>
                    </div>
                </div>
            </div>

            {product.batches && product.batches.length > 0 && (
                <div className='mx-auto mt-6 flex w-full max-w-5xl flex-col gap-4 rounded-xl bg-white p-4 sm:mt-10 sm:p-6'>
                    <h2 className='mb-1 text-lg font-bold sm:mb-2 sm:text-xl'>Active Batches</h2>
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-180'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='p-3 text-left text-sm font-semibold'>Batch No</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Location</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Remaining</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Rate</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {product.batches.map((b) => (
                                    <tr key={b.id} className='border-t duration-150 hover:bg-gray-50'>
                                        <td className='p-3 text-sm'>{b.batch_no}</td>
                                        <td className='p-3 text-sm'>{b.location_name}</td>
                                        <td className='p-3 text-sm'>{b.quantity_remaining} / {b.quantity_initial}</td>
                                        <td className='p-3 text-sm'>{`\u20B9${b.buying_rate}`}</td>
                                        <td className='p-3 text-sm'>{b.expire_date || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default View
