'use client'
import React, { useState } from 'react'
import { IoMdArrowBack } from "react-icons/io";
import Link from 'next/link';



const Add = () => {
    const [expireHandling, setExpireHandling] = useState(false)
    return (
        <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-10'>Add Product</h1>

            <div className='w-[70%] mx-auto rounded-xl bg-white p-6 '>
                <form className='flex flex-col gap-6'>
                    <div className='flex flex-col items-center gap-4'>
                        <p className='text-lg font-bold mb-4 mr-auto'>Basic information</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="productName" className='text-sm font-light'>Product Name*</label>
                            <input id="productName" placeholder="Tata salt 1KG" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="category" className='text-sm font-light'>Category*</label>
                            <input id="category" placeholder="Spices" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="brand" className='text-sm font-light'>Brand (optional)</label>
                            <input id="brand" placeholder="Tata" className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>

                        <p className='text-lg font-bold mb-4 mr-auto'>Product configuration</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="unit" className='text-sm font-light'>Unit*</label>
                            <input id="unit" placeholder="KG / pcs / liter" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="sellingPrice" className='text-sm font-light'>Selling Price*</label>
                            <input id="sellingPrice" placeholder="₹ 22" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="minimumStock" className='text-sm font-light'>Minimum stock level</label>
                            <input id="minimumStock" placeholder="20" className='px-4 py-2 border border-gray-300 rounded-lg' />
                        </span>
                        <div className='w-full flex gap-3 items-center'>
                            <span className='flex flex-col gap-2 w-full'>
                                <label htmlFor="bulkQuantity" className='text-sm font-light'>Bulk quantity*</label>
                                <input id="bulkQuantity" placeholder="20" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                            <span className='flex flex-col gap-2 w-full'>
                                <label htmlFor="bulkPrice" className='text-sm font-light'>Bulk price*</label>
                                <input id="bulkPrice" placeholder="₹ 17" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                        </div>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>

                        <p className='text-lg font-bold mb-4 mr-auto'>Expire handling</p>
                        <div className='flex items-center justify-between bg-gray-100 p-6 rounded-lg w-full'>
                            <span>
                                <p className='text-sm'>Enable Tracking</p>
                                <p className='text-xs text-gray-400'>Enable if this product has an expiration date</p>
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={expireHandling} onChange={() => setExpireHandling(!expireHandling)} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-gray-700 peer-checked:bg-[#008C83]"></div>
                            </label>
                        </div>
                        {expireHandling && (
                            <span className='flex flex-col gap-2 w-full'>
                                <label htmlFor="expireDate" className='text-sm font-light'>Expire Date*</label>
                                <input id="expireDate" placeholder="MM/DD/YYYY" required type='date' className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                        )}

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>

                        <p className='text-lg font-bold mb-4 mr-auto'>System information</p>
                        <span className='flex flex-col gap-2 w-full'>
                            <label htmlFor="productCode" className='text-sm font-light'>Product code*</label>
                            <input id="productCode" placeholder="9876543210123" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            <p className='text-xs text-gray-400 -mt-1'>Cannot be edited later</p>
                        </span>
                        <div className='w-full flex gap-3 items-center'>
                            <span className='flex flex-col gap-2 w-full'>
                                <label htmlFor="shopStock" className='text-sm font-light'>Shop stock*</label>
                                <input id="shopStock" placeholder="45" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                            <span className='flex flex-col gap-2 w-full'>
                                <label htmlFor="storageStock" className='text-sm font-light'>Storage stock*</label>
                                <input id="storageStock" placeholder="107" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                            </span>
                        </div>

                        <div className='w-full h-px bg-gray-200 my-3 rounded'></div>
                        <div className='w-full flex items-center justify-between'>
                            <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                            <button type='submit' className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200'>Add Product</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Add