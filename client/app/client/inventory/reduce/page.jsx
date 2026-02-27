'use client'
import React, {useState} from 'react'
import { IoMdArrowBack } from "react-icons/io";
import Link from 'next/link';
import { FaRegTrashCan } from "react-icons/fa6";
import { FaRegClock } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import { IoShieldOutline } from "react-icons/io5";

const Reduce = () => {
    const [reductionReason, setReductionReason] = useState('expired');
  return (
 <div className='w-full min-h-screen bg-[#E6FFFD] px-4 py-20 sm:px-6 lg:px-10'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-2'>Stock Reduction</h1>
            <p className='text-sm text-gray-400 mb-10'>Record non-sale stock reduction (expiry, damage, loss)</p>

            <div className='mx-auto mb-10 flex w-full max-w-5xl items-center justify-start gap-4 rounded-lg border border-[#FFE4D6] bg-[#FFF9F5] p-5 text-[#D84315] sm:gap-6 sm:p-6'>
                <FaRegTrashCan className='text-lg' />
                <span>
                    <h2 className='font-semibold'>Caution: Stock reduction</h2>
                    <p className='text-sm opacity-80'>This action will permanently reduce stock. All adjustments are logged and will appear in loss reports.</p>
                </span>
            </div>
 
            <div className='mx-auto mb-10 flex w-full max-w-5xl flex-col items-start gap-6 rounded-lg bg-white p-6'>
                <span className='w-full'>
                    <label htmlFor="product" className='font-light'>Select product*</label>
                    <input type="text" id="product" name='product' className='w-full px-4 py-2 rounded-lg mt-2 border border-gray-200' />
                    <p className='text-sm text-gray-400 mt-2'>shop: -- | Storage: -- | Total: --</p>
                </span>
                <span className='w-full'>
                    <p>Reason for adjustment*</p>
                    <div className='mt-2 flex w-full flex-wrap items-center justify-start gap-4'>
                        <div className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border py-6 sm:w-[calc(33.333%-0.75rem)] ${reductionReason === 'expired' ? 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' : 'text-gray-400'}`} onClick={() => setReductionReason('expired')}>
                            <FaRegClock/>
                            <p className='text-sm'>Expired</p>
                        </div>
                        <div className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border py-6 sm:w-[calc(33.333%-0.75rem)] ${reductionReason === 'damage' ? 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' : 'text-gray-400'}`} onClick={() => setReductionReason('damage')}>
                            <IoWarningOutline/>
                            <p className='text-sm'>Damage</p>
                        </div>
                        <div className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border py-6 sm:w-[calc(33.333%-0.75rem)] ${reductionReason === 'lost' ? 'text-[#D84315] bg-[#FFEBEE] border-[#FFCDD2]' : 'text-gray-400'}`} onClick={() => setReductionReason('lost')}>
                            <IoShieldOutline/>
                            <p className='text-sm'>Lost / Theft</p>
                        </div>
                    </div>
                </span>
                <span className='w-full'>
                    <label htmlFor="quantity" className='font-light'>Quantity to reduce*</label>
                    <input type="number" id="quantity" name='quantity' className='w-full px-4 py-2 rounded-lg mt-2 border border-gray-200' />
                    <p className='text-sm text-gray-400 mt-2'>Maximum available: -- pcs</p>
                </span>
                <span className='w-full'>
                    <label htmlFor="notes" className='font-light'>Additional notes</label>
                    <textarea rows={4} type="text" id="notes" name='notes' className='w-full px-4 py-2 rounded-lg mt-2 border border-gray-200' />
                    <p className='text-sm text-gray-400 mt-2'>Optional</p>
                </span>
                <div className='w-[95%] mx-auto h-px bg-gray-300 mt-2'></div>
                <div className='mt-2 flex w-full flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
                    <Link href="/client/inventory" className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 duration-150'>cancel</Link>
                    <button type='submit' className='px-6 py-2 bg-[#D84315] text-white rounded-lg hover:bg-[#A6280B] duration-200'>Confirm reduction</button>
                </div>
            </div>
    </div>
  )
}

export default Reduce
