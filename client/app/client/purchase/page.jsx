'use client'
import React, {useState} from 'react'
import Link from 'next/link';
import { IoMdAdd } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import { GoPencil } from "react-icons/go";
import { FaRegEye } from "react-icons/fa";


const supplierData = [
    { name: 'ABC Suppliers', contact: '9876543210', address: '123 Main St, City', outstanding: 5000, status: 'Active' },
    { name: 'XYZ Traders', contact: '9123456780', address: '456 Market Ave, City', outstanding: 12000, status: 'Active' },
    { name: 'PQR Distributors', contact: '9988776655', address: '789 Commerce Rd, City', outstanding: 0, status: 'Inactive' },
    { name: 'LMN Wholesalers', contact: '9876501234', address: '321 Industrial Blvd, City', outstanding: 3000, status: 'Active' },
    { name: 'DEF Enterprises', contact: '9123409876', address: '654 Business St, City', outstanding: 8000, status: 'Inactive' },
    { name: 'GHI Suppliers', contact: '9988770011', address: '987 Trade Ln, City', outstanding: 2000, status: 'Active' },
    { name: 'JKL Traders', contact: '9876504321', address: '159 Commerce Ave, City', outstanding: 15000, status: 'Active' },
    { name: 'MNO Distributors', contact: '9123456789', address: '753 Market St, City', outstanding: 0, status: 'Inactive' },
    { name: 'QRS Wholesalers', contact: '9988771234', address: '852 Industrial Rd, City', outstanding: 4000, status: 'Active' },
    { name: 'TUV Enterprises', contact: '9876509876', address: '456 Business Ave, City', outstanding: 6000, status: 'Active' },
    { name: 'WXY Suppliers', contact: '9123401234', address: '321 Trade St, City', outstanding: 0, status: 'Inactive' },
    { name: 'ZAB Traders', contact: '9988774321', address: '654 Commerce Blvd, City', outstanding: 7000, status: 'Active' },
    { name: 'CDE Distributors', contact: '9876506789', address: '789 Market Ave, City', outstanding: 0, status: 'Inactive' },
    { name: 'FGH Wholesalers', contact: '9123456781', address: '123 Industrial St, City', outstanding: 9000, status: 'Active' },
    { name: 'IJK Enterprises', contact: '9988775678', address: '456 Business Rd, City', outstanding: 0, status: 'Inactive' },
    { name: 'LMN Suppliers', contact: '9876501230', address: '321 Trade Ave, City', outstanding: 11000, status: 'Active' },
    { name: 'OPQ Traders', contact: '9123409870', address: '654 Commerce St, City', outstanding: 0, status: 'Inactive' },
    { name: 'RST Distributors', contact: '9988778901', address: '789 Market Blvd, City', outstanding: 5000, status: 'Active' },
    { name: 'UVW Wholesalers', contact: '9876504320', address: '123 Industrial Ave, City', outstanding: 0, status: 'Inactive' },
    { name: 'XYZ Enterprises', contact: '9123456782', address: '456 Business St, City', outstanding: 8000, status: 'Active' },
    { name: 'ABC Suppliers', contact: '9876543210', address: '123 Main St, City', outstanding: 5000, status: 'Active' },
    { name: 'XYZ Traders', contact: '9123456780', address: '456 Market Ave, City', outstanding: 12000, status: 'Active' },
    { name: 'PQR Distributors', contact: '9988776655', address: '789 Commerce Rd, City', outstanding: 0, status: 'Inactive' },
    { name: 'LMN Wholesalers', contact: '9876501234', address: '321 Industrial Blvd, City', outstanding: 3000, status: 'Active' },
    { name: 'DEF Enterprises', contact: '9123409876', address: '654 Business St, City', outstanding: 8000, status: 'Inactive' },
    { name: 'GHI Suppliers', contact: '9988770011', address: '987 Trade Ln, City', outstanding: 2000, status: 'Active' },
    { name: 'JKL Traders', contact: '9876504321', address: '159 Commerce Ave, City', outstanding: 15000, status: 'Active' },
    { name: 'MNO Distributors', contact: '9123456789', address: '753 Market St, City', outstanding: 0, status: 'Inactive' },
    { name: 'QRS Wholesalers', contact: '9988771234', address: '852 Industrial Rd, City', outstanding: 4000, status: 'Active' },
    { name: 'TUV Enterprises', contact: '9876509876', address: '456 Business Ave, City', outstanding: 6000, status: 'Active' },
    { name: 'WXY Suppliers', contact: '9123401234', address: '321 Trade St, City', outstanding: 0, status: 'Inactive' },
    { name: 'ZAB Traders', contact: '9988774321', address: '654 Commerce Blvd, City', outstanding: 7000, status: 'Active' },
    { name: 'CDE Distributors', contact: '9876506789', address: '789 Market Ave, City', outstanding: 0, status: 'Inactive' },
    { name: 'FGH Wholesalers', contact: '9123456781', address: '123 Industrial St, City', outstanding: 9000, status: 'Active' },
    { name: 'IJK Enterprises', contact: '9988775678', address: '456 Business Rd, City', outstanding: 0, status: 'Inactive' },
    { name: 'LMN Suppliers', contact: '9876501230', address: '321 Trade Ave, City', outstanding: 11000, status: 'Active' },
    { name: 'OPQ Traders', contact: '9123409870', address: '654 Commerce St, City', outstanding: 0, status: 'Inactive' },
    { name: 'RST Distributors', contact: '9988778901', address: '789 Market Blvd, City', outstanding: 5000, status: 'Active' },
    { name: 'UVW Wholesalers', contact: '9876504320', address: '123 Industrial Ave, City', outstanding: 0, status: 'Inactive' },
    { name: 'XYZ Enterprises', contact: '9123456782', address: '456 Business St, City', outstanding: 8000, status: 'Active' },
]

const Purchase = () => {
    const perPage = 10
       const [currentPage, setCurrentPage] = useState(1)
   
       const paginatedData = supplierData.slice((currentPage - 1) * perPage, currentPage * perPage)
       const totalPages = Math.ceil(supplierData.length / perPage)
   
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
        <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
            <span className='w-full flex items-center justify-between gap-4 mb-10'>
                <h2 className='font-semibold text-4xl'>Suppliers <p className='text-sm text-gray-400 font-normal mt-2'>Manage supplier information and relationships</p></h2>
                <span className='gap-2 flex'>
                    <Link href="/client/purchase/add" className='bg-[#008C83] px-5 hover:bg-[#00675B] text-white py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><IoMdAdd /> Add Supplier</Link>
                </span>
            </span>

            <div className='w-full mx-auto rounded-lg mb-10 flex gap-6 items-center justify-center'>
                <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
                    <p>Total Suppliers</p>
                    <p className='text-3xl font-bold'>{supplierData.length}</p>
                </div>
                <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
                    <p>Active Suppliers</p>
                    <p className='text-3xl font-bold text-green-500'>{supplierData.filter(supplier => supplier.status === 'Active').length}</p>
                </div>
                <div className='w-1/3 p-5 bg-white rounded-lg flex flex-col items-start gap-4'>
                    <p>Total Outstanding</p>
                    <p className='text-3xl font-bold text-red-500'>₹{supplierData.reduce((total, supplier) => total + supplier.outstanding, 0)}</p>
                </div>
            </div>

            <div className='w-full h-20 bg-white rounded-lg flex items-center justify-between px-8'>
                <span className='p-4 border border-gray-200 rounded-xl flex items-center justify-center w-[70%]'>
                    <CiSearch />
                    <input type="text" placeholder={`Search by product name or barcode`} className='ml-2 w-full h-full border-none outline-none' />
                </span>
                <div>
                    <select className='ml-4 p-3 rounded-lg border border-gray-300'>
                        <option value="">All Suppliers</option>
                        <option value="fruits">Fruits</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="dairy">Dairy</option>
                        <option value="bakery">Bakery</option>
                    </select>
                </div>
            </div>

                <div className='w-full mx-auto rounded-lg bg-white mt-10 overflow-x-auto'>
                    <table className='w-full table-auto'>
                        <thead>
                            <tr className='text-left bg-gray-100'>
                                <th className='p-4'>Supplier Name</th>
                                <th className='p-4'>Contact</th>
                                <th className='p-4'>Address</th>
                                <th className='p-4'>Outstanding</th>
                                <th className='p-4'>Status</th>
                                <th className='p-4 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={index} className='border-t hover:bg-gray-50'>
                                    <td className='p-6 text-sm'>{item.name}</td>
                                    <td className='p-6 text-sm'>{item.contact}</td>
                                    <td className='p-6 text-sm'>{item.address}</td>
                                    <td className={`p-6 text-sm font-semibold ${item.outstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>₹ {item.outstanding}</td>
                                    <td className={`p-6 text-sm font-semibold ${item.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}>{item.status}</td>
                                    <td className='p-6 text-sm flex items-center justify-center gap-4'>
                                        <Link href={`/client/purchase/${index}/view`} className='text-green-500 hover:underline text-lg'><FaRegEye /></Link>
                                        <Link href={`/client/purchase/${index}/edit`} className='text-gray-500 hover:underline text-lg'><GoPencil /></Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
                    <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {supplierData.length} items</p>
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

export default Purchase