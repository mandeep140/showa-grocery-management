'use client'
import React, { useState } from 'react'
import { IoMdArrowBack, IoMdAdd } from "react-icons/io";
import Link from 'next/link';
import { FaBox } from 'react-icons/fa';
import { FaStore } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";




const Transfer = () => {
    const [transfterType, setTransferType] = useState(true);
    return (
        <div className='w-full min-h-screen bg-[#E6FFFD] px-4 py-20 sm:px-6 lg:px-10'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-2'>Stock Transfer</h1>
            <p className='text-sm text-gray-400 mb-10'>Move stock between storage and shop floor</p>

            <div className='mx-auto mb-10 flex w-full max-w-5xl flex-col items-center gap-4 lg:flex-row lg:gap-6'>
                <div className='w-full rounded-lg bg-white px-4 py-6 duration-150 lg:w-1/2'>
                    <div className='flex gap-3 items-center mb-4'>
                        <span className='p-4 bg-[#E3F2FD] rounded-lg text-lg text-[#2196F3]'><FaStore /></span>
                        <span>
                            <p className='font-semibold text-lg'>Storage Stock</p>
                            <p className='text-sm text-gray-400'>Godown / Warehouse</p>
                        </span>
                    </div>
                    <p className='text-gray-500'>Select a product to view count</p>
                </div>
                <div className='w-full rounded-lg bg-white px-4 py-6 duration-150 lg:w-1/2'>
                    <div className='flex gap-3 items-center mb-4'>
                        <span className='p-4 bg-[#E8F5E9] rounded-lg text-lg text-[#4CAF50]'><FaBox /></span>
                        <span>
                            <p className='font-semibold text-lg'>Shop Stock</p>
                            <p className='text-sm text-gray-400'>Shop floor / Display</p>
                        </span>
                    </div>
                    <p className='text-gray-500'>Select a product to view count</p>
                </div>
            </div>

            <div className='mx-auto mb-10 flex w-full max-w-5xl flex-col items-start gap-6 rounded-lg bg-white p-6'>
                <h2 className='text-lg font-semibold mb-4'>Transfer Details</h2>
                <span className='w-full'>
                    <label htmlFor="product" className='font-light'>Select product*</label>
                    <input type="text" id="product" name='product' className='w-full px-4 py-2 rounded-lg mt-2 border border-gray-200' />
                </span>
                <h2 className='-mb-4 font-light'>Transfer direction*</h2>
                <div className='flex w-full flex-col items-center gap-4 md:flex-row'>
                    <span className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border py-4 md:w-1/2 ${transfterType ? 'text-[#008C83] bg-[#E0F2F1] border-[#008C83]' : 'text-gray-400'}`} onClick={() => setTransferType(true)}>
                        <FaStore />
                        <FaArrowRight />
                        <FaBox />
                        <p>Storage</p>
                        <FaArrowRight />
                        <p>Shop</p>
                    </span>
                    <span className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border py-4 md:w-1/2 ${!transfterType ? 'text-[#008C83] bg-[#E0F2F1] border-[#008C83]' : 'text-gray-400'}`} onClick={() => setTransferType(false)}>
                        <FaBox />
                        <FaArrowRight />
                        <FaStore />
                        <p>Shop</p>
                        <FaArrowRight />
                        <p>Storage</p>
                    </span>
                </div>
                <span className='w-full'>
                    <label htmlFor="quantity" className='font-light'>Quantity*</label>
                    <input type="number" id="quantity" name='quantity' className='w-full px-4 py-2 rounded-lg mt-2 border bg-gray-50 border-gray-200' />
                </span>
                <div className='w-[95%] h-px bg-gray-300 mx-auto'></div>
                <div className='mt-2 flex w-full flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
                    <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                    <button type='submit' className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200'>Confirm transfer</button>
                </div>
            </div>

        </div>
    )
}

export default Transfer
