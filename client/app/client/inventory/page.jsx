'use client'
import React, { useState, useEffect } from 'react'
import { VscDebugRestart } from "react-icons/vsc"
import { BiTransfer } from "react-icons/bi"
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { FaEye } from "react-icons/fa"
import { GoPencil } from "react-icons/go"
import { FiTrash2 } from "react-icons/fi"
import Link from 'next/link'
import { RiFolderReduceFill } from "react-icons/ri"
import api from '@/util/api'

const Inventory = () => {
    const perPage = 10
    const [currentPage, setCurrentPage] = useState(1)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [locationFilter, setLocationFilter] = useState('')

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products')
            if (res.data.success) setProducts(res.data.products)
        } catch (err) {
            console.error('Failed to fetch products:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories')
            if (res.data.success) setCategories(res.data.categories)
        } catch (err) {}
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Deactivate "${name}"?`)) return
        try {
            const res = await api.delete(`/api/products/${id}`)
            if (res.data.success) {
                setProducts(prev => prev.filter(p => p.id !== id))
            } else {
                alert(res.data.message)
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete')
        }
    }

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)) || (p.product_code && p.product_code.toLowerCase().includes(search.toLowerCase()))
        const matchCat = !categoryFilter || String(p.category_id) === categoryFilter
        const matchLocation = !locationFilter || String(p.location_id) === locationFilter
        return matchSearch && matchCat && matchLocation
    })

    const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
    const totalPages = Math.ceil(filtered.length / perPage)

    useEffect(() => { setCurrentPage(1) }, [search, categoryFilter, locationFilter])

    const getPageNumbers = () => {
        const pages = []
        if (totalPages <= 4) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (currentPage > 3) pages.push('...')
            const showPrevious = currentPage - 1
            const showNext = currentPage + 1
            if (showPrevious > 1 && showPrevious < totalPages) pages.push(showPrevious)
            if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage)
            if (showNext < totalPages && showNext > 1) pages.push(showNext)
            if (currentPage < totalPages - 2) pages.push('...')
            if (totalPages > 1) pages.push(totalPages)
        }
        return pages
    }

    const getStatus = (item) => {
        const stock = item.total_stock || 0
        if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-200' }
        if (stock <= (item.minimum_stock_level || 0)) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' }
        return { text: 'In Stock', color: 'text-green-600', bg: 'hover:bg-gray-50' }
    }

    return (
        <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
            <span className='w-full flex items-center justify-between gap-4 mb-10'>
                <h2 className='font-semibold text-4xl'>Inventory</h2>
                <span className='gap-2 flex'>
                    <Link href="/client/inventory/reduce" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><RiFolderReduceFill /> Reduce</Link>
                    <Link href="/client/inventory/return" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><VscDebugRestart /> Return</Link>
                    <Link href="/client/inventory/transfer" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><BiTransfer /> Transfer</Link>
                    <Link href="/client/inventory/add" className='bg-[#008C83] px-5 hover:bg-[#00675B] text-white py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><IoMdAdd /> Add Product</Link>
                </span>
            </span>

            <div className='w-full h-20 bg-white rounded-lg flex items-center justify-between px-8'>
                <span className='p-4 border border-gray-200 rounded-xl flex items-center justify-center w-[70%]'>
                    <CiSearch />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by product name or barcode' className='ml-2 w-full h-full border-none outline-none' />
                </span>
                <div>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className='ml-4 p-3 rounded-lg border border-gray-300'>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className='w-full mt-10 flex items-center justify-center'><p className='text-gray-500'>Loading products...</p></div>
            ) : (
            <div>
                <table className='w-full mt-6 bg-white rounded-t-lg overflow-hidden'>
                    <thead className='bg-[#F5F5F5]'>
                        <tr>
                            <th className='text-left p-4 font-semibold'>Product Name</th>
                            <th className='text-left p-4 font-semibold'>Category</th>
                            <th className='text-left p-4 font-semibold'>Unit</th>
                            <th className='text-left p-4 font-semibold'>Total Stock</th>
                            <th className='text-left p-4 font-semibold'>Min Stock</th>
                            <th className='text-left p-4 font-semibold'>Selling Price</th>
                            <th className='text-left p-4 font-semibold'>Status</th>
                            <th className='text-left p-4 font-semibold'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item) => {
                            const status = getStatus(item)
                            return (
                            <tr key={item.id} className={`border-t ${status.bg} duration-200`}>
                                <td className='p-6 text-sm font-medium'>{item.name}</td>
                                <td className='p-6 text-sm'>{item.category_name || '—'}</td>
                                <td className='p-6 text-sm'>{item.unit}</td>
                                <td className='p-6 text-sm'>{item.total_stock} {item.unit}</td>
                                <td className='p-6 text-sm'>{item.minimum_stock_level} {item.unit}</td>
                                <td className='p-6 text-sm'>₹{item.default_selling_price}</td>
                                <td className='p-6 text-sm'>
                                    <span className={`${status.color} font-medium`}>{status.text}</span>
                                </td>
                                <td className='p-6 text-sm gap-4 flex items-center justify-start'>
                                    <Link href={`/client/inventory/${item.id}/view`} className='text-lg text-green-500 cursor-pointer'><FaEye /></Link>
                                    <Link href={`/client/inventory/${item.id}/edit`} className='text-lg text-gray-500 cursor-pointer'><GoPencil /></Link>
                                    <button onClick={() => handleDelete(item.id, item.name)} className='text-lg text-red-400 cursor-pointer hover:text-red-600 duration-200'><FiTrash2 /></button>
                                </td>
                            </tr>
                            )
                        })}
                        {paginatedData.length === 0 && (
                            <tr><td colSpan={8} className='p-10 text-center text-gray-400'>No products found</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
                    <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {filtered.length} items</p>
                    <div className='flex justify-center items-center gap-4'>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                        >
                            Previous
                        </button>
                        <div>
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-4 py-2 mx-1">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 mx-1 rounded-lg ${currentPage === page ? 'bg-[#008C83] text-white' : 'bg-gray-300'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
                )}
            </div>
            )}
        </div>
    )
}

export default Inventory
