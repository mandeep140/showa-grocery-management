'use client'
import React, { useState, useEffect } from 'react'
import { VscDebugRestart } from "react-icons/vsc"
import { BiTransfer } from "react-icons/bi"
import { IoMdAdd } from "react-icons/io"
import { CiSearch } from "react-icons/ci"
import { FaEye } from "react-icons/fa"
import { GoPencil } from "react-icons/go"
import { FiTrash2 } from "react-icons/fi"
import { IoChevronDown } from "react-icons/io5"
import Link from 'next/link'
import Image from 'next/image'
import { RiFolderReduceFill } from "react-icons/ri"
import api from '@/util/api'
import { getServerURL } from '@/util/FindIP'

const Inventory = () => {
    const perPage = 20
    const [currentPage, setCurrentPage] = useState(1)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [locationFilter, setLocationFilter] = useState('')
    const [totalProducts, setTotalProducts] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
    const searchTimeout = React.useRef(null)
    const categoryDropdownRef = React.useRef(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [currentPage, categoryFilter, locationFilter])

    useEffect(() => {
        const handleOutside = (event) => {
            if (!categoryDropdownRef.current) return
            if (!categoryDropdownRef.current.contains(event.target)) setCategoryDropdownOpen(false)
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

    const fetchProducts = async (searchVal) => {
        try {
            setLoading(true)
            const s = searchVal !== undefined ? searchVal : search
            let url = `/api/products?limit=${perPage}&page=${currentPage}`
            if (s) url += `&search=${encodeURIComponent(s)}`
            if (categoryFilter) url += `&category_id=${categoryFilter}`
            if (locationFilter) url += `&location_id=${locationFilter}`
            const res = await api.get(url)
            if (res.data.success) {
                setProducts(res.data.products)
                setTotalProducts(res.data.total || 0)
                setTotalPages(res.data.totalPages || 1)
            }
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

    const handleSearch = (value) => {
        setSearch(value)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            setCurrentPage(1)
            fetchProducts(value)
        }, 350)
    }

    const handleCategoryChange = (val) => {
        setCategoryFilter(val)
        setCurrentPage(1)
    }

    const getImageURL = (path) => {
        if (!path) return null
        return `${getServerURL()}/api/products/image/${path}`
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Deactivate "${name}"?`)) return
        try {
            const res = await api.delete(`/api/products/${id}`)
            if (res.data.success) {
                fetchProducts()
            } else {
                alert(res.data.message)
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete')
        }
    }

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

    const selectedCategoryLabel = categories.find((c) => String(c.id) === String(categoryFilter))?.name || 'All Categories'

    return (
        <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
            <span className='mb-6 flex w-full flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between'>
                <h2 className='text-3xl font-semibold sm:text-4xl'>Inventory</h2>
                <span className='grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end'>
                    <Link href="/client/inventory/reduce" className='flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm duration-200 hover:bg-gray-100 sm:px-5 sm:text-base'><RiFolderReduceFill /> Reduce</Link>
                    <Link href="/client/inventory/return" className='flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm duration-200 hover:bg-gray-100 sm:px-5 sm:text-base'><VscDebugRestart /> Return</Link>
                    <Link href="/client/inventory/transfer" className='flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm duration-200 hover:bg-gray-100 sm:px-5 sm:text-base'><BiTransfer /> Transfer</Link>
                    <Link href="/client/inventory/add" className='flex items-center justify-center gap-2 rounded-lg bg-[#008C83] px-3 py-2 text-sm text-white duration-200 hover:bg-[#00675B] sm:px-5 sm:text-base'><IoMdAdd /> Add Product</Link>
                </span>
            </span>

            <div className='flex w-full flex-col gap-3 rounded-lg bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between'>
                <span className='flex w-full items-center justify-center rounded-xl border border-gray-200 p-3 lg:w-[70%]'>
                    <CiSearch />
                    <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder='Search by product name or barcode' className='ml-2 h-full w-full border-none text-sm outline-none sm:text-base' />
                </span>
                <div ref={categoryDropdownRef} className='w-full lg:w-auto'>
                    <div className='relative'>
                        <button
                            type="button"
                            onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                            className='flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-left lg:min-w-52'
                        >
                            <span>{selectedCategoryLabel}</span>
                            <IoChevronDown className='text-sm text-gray-500' />
                        </button>
                        {categoryDropdownOpen && (
                            <div className='absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg'>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleCategoryChange('')
                                        setCategoryDropdownOpen(false)
                                    }}
                                    className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD]'
                                >
                                    All Categories
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            handleCategoryChange(String(c.id))
                                            setCategoryDropdownOpen(false)
                                        }}
                                        className='w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-[#E6FFFD] last:border-0'
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className='mt-10 flex w-full items-center justify-center'><p className='text-gray-500'>Loading products...</p></div>
            ) : (
            <div>
                <div className='mt-6 overflow-x-auto rounded-t-lg bg-white'>
                    <table className='w-full min-w-245'>
                        <thead className='bg-[#F5F5F5]'>
                            <tr>
                                <th className='p-4 text-left font-semibold'>Image</th>
                                <th className='p-4 text-left font-semibold'>Product Name</th>
                                <th className='p-4 text-left font-semibold'>Unit</th>
                                <th className='p-4 text-left font-semibold'>Total Stock</th>
                                <th className='p-4 text-left font-semibold'>Min Stock</th>
                                <th className='p-4 text-left font-semibold'>Selling Price</th>
                                <th className='p-4 text-left font-semibold'>Status</th>
                                <th className='p-4 text-left font-semibold'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((item) => {
                                const status = getStatus(item)
                                return (
                                <tr key={item.id} className={`border-t ${status.bg} duration-200`}>
                                    <td className='p-6 text-sm font-medium'>
                                        {item.img_path ? (
                                            <Image src={getImageURL(item.img_path)} alt={item.name} width={48} height={48} unoptimized className='h-12 w-12 rounded-md object-cover' />
                                        ) : (
                                            <div className='flex h-12 w-12 items-center justify-center rounded-md bg-gray-200 text-gray-500'>
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className='p-6 text-sm font-medium'>{item.name}</td>
                                    <td className='p-6 text-sm'>{item.unit}</td>
                                    <td className='p-6 text-sm'>{item.total_stock} {item.unit}</td>
                                    <td className='p-6 text-sm'>{item.minimum_stock_level} {item.unit}</td>
                                    <td className='p-6 text-sm'>{`\u20B9${item.default_selling_price}`}</td>
                                    <td className='p-6 text-sm'>
                                        <span className={`${status.color} font-medium`}>{status.text}</span>
                                    </td>
                                    <td className='flex items-center justify-start gap-4 p-6 text-sm'>
                                        <Link href={`/client/inventory/${item.id}/view`} className='cursor-pointer text-lg text-green-500'><FaEye /></Link>
                                        <Link href={`/client/inventory/${item.id}/edit`} className='cursor-pointer text-lg text-gray-500'><GoPencil /></Link>
                                        <button onClick={() => handleDelete(item.id, item.name)} className='cursor-pointer text-lg text-red-400 duration-200 hover:text-red-600'><FiTrash2 /></button>
                                    </td>
                                </tr>
                                )
                            })}
                            {products.length === 0 && (
                                <tr><td colSpan={8} className='p-10 text-center text-gray-400'>No products found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                <div className="flex flex-col gap-4 rounded-b-lg bg-[#FAFAFA] px-4 pb-4 pt-5 md:flex-row md:items-center md:justify-between">
                    <p className='text-sm font-light tracking-wide sm:text-base'>showing {products.length} of {totalProducts} items</p>
                    <div className='flex flex-wrap items-center justify-start gap-2 sm:justify-center sm:gap-4'>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-gray-300 bg-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-base"
                        >
                            Previous
                        </button>
                        <div className='flex flex-wrap gap-1'>
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-2 py-2 sm:px-4">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`rounded-lg px-3 py-2 text-sm sm:px-4 sm:text-base ${currentPage === page ? 'bg-[#008C83] text-white' : 'bg-gray-300'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-gray-300 bg-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-base"
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
