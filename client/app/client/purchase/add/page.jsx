import React from 'react'
import Link from 'next/link';
import { IoMdArrowBack } from "react-icons/io";

const Add = () => {
  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/purchase" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to suppliers</Link>
            <h1 className='text-3xl font-bold mb-2'>Add supplier</h1>
            <p className='text-sm text-gray-400 mb-10'>Create a new supplier record.</p>
            <div className='w-[80%] mx-auto bg-white p-6 rounded-lg'>
                <h2 className='text-xl font-semibold mb-4'>Supplier Information</h2>
                <form className='flex flex-col gap-6'>
                    <span className='flex flex-col gap-2 w-full'>
                        <label htmlFor="name" className='text-sm font-light'>Supplier Name*</label>
                        <input id="name" placeholder="ABC Suppliers" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                    </span>
                    <span className='flex flex-col gap-2 w-full'>
                        <label htmlFor="contact" className='text-sm font-light'>Contact number*</label>
                        <input id="contact" placeholder="9876543210" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                    </span>
                    <span className='flex flex-col gap-2 w-full'>
                        <label htmlFor="address" className='text-sm font-light'>Address*</label>
                        <input id="address" placeholder="123 Main St, City" required className='px-4 py-2 border border-gray-300 rounded-lg' />
                    </span>
                    <span className='flex flex-col gap-2 w-full'>
                        <label htmlFor="gst" className='text-sm font-light'>GST / TaxID</label>
                        <input id="gst" placeholder="GSTIN1234567890" className='px-4 py-2 border border-gray-300 rounded-lg' />
                    </span>
                    <span className='flex flex-col gap-2 w-full'>
                        <label htmlFor="notes" className='text-sm font-light'>Notes</label>
                        <textarea id="notes" placeholder="Additional notes" rows={4} className='px-4 py-2 border border-gray-300 rounded-lg' />
                    </span>
                    <hr />
                    <div className='w-full flex items-center justify-between gap-4 mt-4'>
                        <Link href="/client/purchase" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                        <button type='submit' className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200'>Add supplier</button>
                    </div>
                </form>
            </div>
    </div>
  )
}

export default Add