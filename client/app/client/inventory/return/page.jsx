"use client"
import React, {useState} from 'react'
import Link from 'next/link';
import { IoMdArrowBack, IoMdAdd } from "react-icons/io";
import { VscDebugRestart } from "react-icons/vsc";
import { FaBox } from 'react-icons/fa';
import { FaFileAlt } from "react-icons/fa";



const Return = () => {
    const [returnType, setReturnType] = useState(true); 
  return (
    <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-2'>Returns management</h1>
            <p className='text-sm text-gray-400 mb-10'>Process customer and supplier returns with inventory impact</p>
            <div className='w-[80%] mx-auto flex gap-6 items-center mb-10'>
                <div 
                    className={`flex items-center justify-center w-1/2 border-2 ${returnType ? 'border-green-500 bg-white' : 'border-gray-300 bg-white'} rounded-lg py-4 gap-4 cursor-pointer hover:border-green-400 duration-150`} 
                    onClick={() => setReturnType(true)}
                >
                    <VscDebugRestart className={`text-4xl ${returnType ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                        <p className='font-semibold text-lg'>Customer returns</p>
                        <p className='text-sm text-gray-400'>Stock increase in shop</p>
                    </div>
                </div>
                <div 
                    className={`flex items-center justify-center w-1/2 border-2 ${!returnType ? 'border-green-500 bg-white' : 'border-gray-300 bg-white'} rounded-lg py-4 gap-4 cursor-pointer hover:border-green-400 duration-150`} 
                    onClick={() => setReturnType(false)}
                >
                    <FaBox className={`text-4xl ${!returnType ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                        <p className='font-semibold text-lg'>Supplier returns</p>
                        <p className='text-sm text-gray-400'>Stock decrease from shop</p>
                    </div>
                </div>
            </div>

            {returnType ? (<div className='w-[80%] mx-auto rounded-lg bg-white flex flex-col gap-6 px-7 py-5'>
                <h2 className='font-semibold flex items-center gap-2'><FaFileAlt className='text-green-500 font-semibold text-xl'/>Customer Return Details</h2>
                <span>
                    <label htmlFor="billNo">Original Bill*</label>
                    <input type="text" name="billNo" id="billNo" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                </span>
                <span>
                    <label htmlFor="product">Product*</label>
                    <input type="text" name="product" id="product" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                </span>
                <span>
                    <label htmlFor="quantity">Quantity*</label>
                    <input type="number" name="quantity" id="quantity" placeholder='3' required className='w-full px-4 py-2 mt-2 rounded-lg border bg-gray-50 border-gray-200' />
                </span>
                <span>
                    <label htmlFor="reason">Reason for return*</label>
                    <input type="text" name="reason" id="reason" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                </span>
                <hr />
                <div className='flex w-full items-center justify-between px-2'>
                    <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                    <button type='submit' className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200'>Process return</button>
                </div>
            </div>) : (
                <div className='w-[80%] mx-auto rounded-lg bg-white flex flex-col gap-6 px-7 py-5'>
                    <h2 className='font-semibold flex items-center gap-2'><FaFileAlt className='text-green-500 font-semibold text-xl'/>Supplier Return Details</h2>
                    <span>
                        <label htmlFor="supplier">Supplier*</label>
                        <input type="text" name="supplier" id="supplier" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                    </span>
                    <span>
                        <label htmlFor="product">Product*</label>
                        <input type="text" name="product" id="product" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                    </span>
                    <span>
                        <label htmlFor="quantity">Quantity*</label>
                        <input type="number" name="quantity" id="quantity" placeholder='3' required className='w-full px-4 py-2 mt-2 rounded-lg border bg-gray-50 border-gray-200' />
                    </span>
                    <span>
                        <label htmlFor="reason">Reason for return*</label>
                        <input type="text" name="reason" id="reason" required className='w-full px-4 py-2 mt-2 rounded-lg border border-gray-200' />
                    </span>
                    <hr />
                    <div className='flex w-full items-center justify-between px-2'>
                        <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                        <button type='submit' className='px-6 py-2 bg-[#008C83] text-white rounded-lg hover:bg-[#007571] duration-200'>Process return</button>
                    </div>
                </div>
                )}
    </div>
  )
}

export default Return