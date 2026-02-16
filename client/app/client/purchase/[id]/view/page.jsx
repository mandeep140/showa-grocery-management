'use client'
import React, { useState } from 'react'
import Link from 'next/link';
import { IoMdArrowBack } from "react-icons/io";
import { useParams } from 'next/navigation';
import { MdCall } from "react-icons/md";
import { IoLocationSharp } from "react-icons/io5";
import { IoTrendingUp } from "react-icons/io5";
import { CiCalendar } from "react-icons/ci";
import { FaRupeeSign } from "react-icons/fa";
import { FaFileAlt } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";





const recentPurchases = [
    {
        invoice: 'INV-001',
        date: '2024-05-15',
        amount: 50000,
        status: 'Paid'
    },
    {
        invoice: 'INV-002',
        date: '2024-04-10',
        amount: 30000,
        status: 'Pending'
    },
    {
        invoice: 'INV-003',
        date: '2024-03-05',
        amount: 70000,
        status: 'Paid'
    },
    {
        invoice: 'INV-004',
        date: '2024-02-20',
        amount: 20000,
        status: 'Paid'
    },
    {
        invoice: 'INV-005',
        date: '2024-01-15',
        amount: 40000,
        status: 'Pending'
    }
];

const supplierReturns = [
    {
        returnNo: 'RET-001',
        date: '2024-05-20',
        reason: 'Damaged goods',
        amount: 5000,
        status: 'Processed'
    },
    {
        returnNo: 'RET-002',
        date: '2024-04-18',
        reason: 'Incorrect items',
        amount: 3000,
        status: 'Pending'
    },
    {
        returnNo: 'RET-003',
        date: '2024-03-22',
        reason: 'Late delivery',
        amount: 2000,
        status: 'Processed'
    }
]


const View = () => {
    const params = useParams();
    const { id } = params;
    const perPage = 10
    const [currentPage, setCurrentPage] = useState(1)

    const paginatedData = supplierReturns.slice((currentPage - 1) * perPage, currentPage * perPage)
    const totalPages = Math.ceil(supplierReturns.length / perPage)

    const getPageNumbers = () => {
        const pages = []

        if (totalPages <= 4) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            const showPrevious = currentPage - 1
            const showNext = currentPage + 1
            if (currentPage > 3) {
                pages.push('...')
            }
            if (showPrevious > 1 && showPrevious < totalPages) {
                pages.push(showPrevious)
            }
            if (currentPage !== 1 && currentPage !== totalPages) {
                pages.push(currentPage)
            }
            if (showNext < totalPages && showNext > 1) {
                pages.push(showNext)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }
    return (
        <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/purchase" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to suppliers</Link>
            <h1 className='text-3xl font-bold mb-10'>Supplier Details - {id}</h1>
            <div className='w-[80%] mx-auto rounded-xl bg-white p-6 gap-6'>
                <div className='w-full flex items-center justify-between'>
                    <h2 className='font-semibold text-lg'>Basic information</h2>
                    <p className='text-green-500'>Active</p>
                </div>
                <div className='w-full flex mt-6'>
                    <div className='w-1/2'>
                        <p className='text-gray-500 text-sm'>Supplier Name</p>
                        <p className=' text-md font-semibold'>ABC Corporation</p>
                    </div>
                    <div className='w-1/2'>
                        <p className='text-gray-500 text-sm'>Distributer ID</p>
                        <p className=' text-md'>John Doe</p>
                    </div>
                </div>
                <div className='w-full flex mt-6'>
                    <div className='w-1/2'>
                        <p className='text-gray-500 text-sm'>Phone number</p>
                        <p className=' text-md flex items-center gap-2'><MdCall className='text-lg text-green-500 font-semibold' /> +91 12345 67890</p>
                    </div>
                    <div className='w-1/2'>
                        <p className='text-gray-500 text-sm'>GST / Tax ID</p>
                        <p className=' text-md'>GSTIN1234567890</p>
                    </div>
                </div>
                <div className='w-full flex mt-6'>
                    <div className='w-1/2'>
                        <p className='text-gray-500 text-sm'>Address</p>
                        <p className=' text-md flex items-center gap-2'><IoLocationSharp className='text-lg text-green-500 font-semibold' /> 123 Main Street, City, Country</p>
                    </div>
                </div>
                <hr className='mt-6' />
                <p className='text-gray-500 text-sm mt-6'>Notes</p>
                <div className='w-full px-4 py-2 bg-gray-100 rounded-md mt-2'>
                    <p className='text-gray-500 text-sm'>Reliable supplier for grocery items. Payment terms: 30 days.</p>
                </div>
            </div>

            <div className='mt-10 w-[80%] mx-auto gap-6 flex items-center justify-center'>
                <div className='w-1/3 p-6 bg-white rounded-xl'>
                    <div className='flex gap-2 items-center mb-4'>
                        <span className='p-4 rounded-xl bg-green-100'>
                            <IoTrendingUp className='text-2xl text-green-500 font-semibold' />
                        </span>
                        <p className='text-gray-500 text-sm'>Total Purchase</p>
                    </div>
                    <p className='text-2xl font-bold text-green-500'>₹ 1,50,000</p>
                    <p className='text-gray-500 text-sm mt-6'>Lifetime value</p>
                </div>
                <div className='w-1/3 p-6 bg-white rounded-xl'>
                    <div className='flex gap-2 items-center mb-4'>
                        <span className='p-4 rounded-xl bg-blue-100'>
                            <CiCalendar className='text-2xl text-blue-500 font-semibold' />
                        </span>
                        <p className='text-gray-500 text-sm'>Last Purchase</p>
                    </div>
                    <p className='text-2xl font-bold text-blue-500'>₹ 50,000</p>
                    <p className='text-gray-500 text-sm mt-6'>Most recent order</p>
                </div>
                <div className='w-1/3 p-6 bg-white rounded-xl'>
                    <div className='flex gap-2 items-center mb-4'>
                        <span className='p-4 rounded-xl bg-red-100'>
                            <FaRupeeSign className='text-2xl text-red-500 font-semibold' />
                        </span>
                        <p className='text-gray-500 text-sm'>Outstanding</p>
                    </div>
                    <p className='text-2xl font-bold text-red-500'>₹ 25,682</p>
                    <p className='text-gray-500 text-sm mt-6'>Pending payment</p>
                </div>
            </div>

            <div className='w-[80%] mx-auto mt-10 bg-white rounded-xl'>
                <h2 className='text-lg font-semibold px-6 py-4'><FaFileAlt className='inline-block text-green-500 mr-2' />Recent Purchases</h2>
                <table className='w-full text-left '>
                    <thead>
                        <tr className='border-y bg-gray-100'>
                            <th className='p-4'>Invoice</th>
                            <th className='p-4'>Date</th>
                            <th className='p-4'>Amount</th>
                            <th className='p-4'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentPurchases.map((purchase, index) => (
                            <tr key={index} className='border-b border-gray-100 hover:bg-gray-100'>
                                <td className='p-4 text-sm'>{purchase.invoice}</td>
                                <td className='p-4 text-sm text-gray-500'>{purchase.date}</td>
                                <td className='p-4 text-green-700'>₹ {purchase.amount.toLocaleString()}</td>
                                <td className={`p-4 ${purchase.status === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>{purchase.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='w-full px-6 py-4 bg-gray-100'>
                    <p className='text-gray-500 text-sm'>Showing 5 most recent purchases</p>
                </div>
            </div>

            <div className='w-[80%] mx-auto bg-white rounded-xl mt-10 p-6'>
                <h2 className='text-lg font-semibold mb-4'><VscDebugRestart className='inline-block text-green-500 mr-2' />Supplier Returns</h2>
                <table className='w-full text-left '>
                    <thead>
                        <tr className='border-y bg-gray-100'>
                            <th className='p-4'>Return No.</th>
                            <th className='p-4'>Date</th>
                            <th className='p-4'>Reason</th>
                            <th className='p-4'>Amount</th>
                            <th className='p-4'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((returnItem, index) => (
                            <tr key={index} className='border-b border-gray-100 hover:bg-gray-100'>
                                <td className='p-4 text-sm'>{returnItem.returnNo}</td>
                                <td className='p-4 text-sm text-gray-500'>{returnItem.date}</td>
                                <td className='p-4 text-sm'>{returnItem.reason}</td>
                                <td className='p-4 text-red-700'>₹ {returnItem.amount.toLocaleString()}</td>
                                <td className={`p-4 ${returnItem.status === 'Processed' ? 'text-green-600' : 'text-red-500'}`}>{returnItem.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
                    <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {supplierReturns.length} items</p>
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
                                    <span key={`ellipsis-${index}`} className="px-4 py-2 mx-1">
                                        ...
                                    </span>
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
            </div>
        </div>
    )
}

export default View