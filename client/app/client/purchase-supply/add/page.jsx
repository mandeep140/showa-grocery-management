'use client'

import Link from 'next/link'
import { IoMdArrowBack } from 'react-icons/io'

const cardClass = 'rounded-xl border border-[#DCE8E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm text-[#2f3b43] outline-none placeholder:text-[#a3adb2] focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20'

const AddSupplierPage = () => {
  return (
    <div className='min-h-screen bg-[#E6FFFD] px-5 pb-10 pt-20 md:px-10 md:pb-12'>
      <div className='mx-auto w-full max-w-[980px]'>
        <Link
          href='/client/purchase-supply'
          className='inline-flex items-center gap-1 text-sm text-[#6f8082] transition-colors hover:text-[#4b5a5c]'
        >
          <IoMdArrowBack className='text-sm' />
          Back to Suppliers
        </Link>

        <h1 className='mt-2.5 text-4xl font-semibold text-[#2F2F2F]'>Add Supplier</h1>
        <p className='mt-1.5 text-sm text-[#7D8B8A]'>Create a new supplier record</p>

        <div className={`${cardClass} mt-5 p-5 md:p-6`}>
          <h2 className='text-base font-semibold text-[#2d3a3a]'>Supplier Information</h2>

          <form className='mt-4 space-y-4'>
            <div>
              <label htmlFor='supplierName' className='text-xs font-medium text-[#5f6a70]'>
                Supplier Name <span className='text-[#e95f57]'>*</span>
              </label>
              <input id='supplierName' type='text' placeholder='e.g., ABC Distributors' className={inputClass} />
            </div>

            <div>
              <label htmlFor='phoneNumber' className='text-xs font-medium text-[#5f6a70]'>
                Phone Number <span className='text-[#e95f57]'>*</span>
              </label>
              <input id='phoneNumber' type='text' placeholder='+91 98765 43210' className={inputClass} />
              <p className='mt-1 text-[11px] text-[#9aa3a8]'>Primary contact number for this supplier</p>
            </div>

            <div>
              <label htmlFor='address' className='text-xs font-medium text-[#5f6a70]'>
                Address <span className='text-[#e95f57]'>*</span>
              </label>
              <textarea
                id='address'
                rows={3}
                placeholder='Enter complete address with city and state'
                className='mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm text-[#2f3b43] outline-none placeholder:text-[#a3adb2] focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20'
              />
            </div>

            <div>
              <label htmlFor='gstTin' className='text-xs font-medium text-[#5f6a70]'>
                GST / Tax ID <span className='text-[#9aa3a8]'>(optional)</span>
              </label>
              <input id='gstTin' type='text' placeholder='e.g., 22AAAAA0000A1Z5' className={inputClass} />
              <p className='mt-1 text-[11px] text-[#9aa3a8]'>Supplier tax identification number</p>
            </div>

            <div>
              <label htmlFor='notes' className='text-xs font-medium text-[#5f6a70]'>
                Notes <span className='text-[#9aa3a8]'>(optional)</span>
              </label>
              <textarea
                id='notes'
                rows={4}
                placeholder='Additional notes about this supplier (payment terms, delivery preferences, etc.)'
                className='mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm text-[#2f3b43] outline-none placeholder:text-[#a3adb2] focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20'
              />
            </div>

            <div className='flex items-center justify-between pt-3'>
              <Link href='/client/purchase-supply' className='rounded-lg border border-[#DCDCDC] px-4 py-2 text-sm text-[#6f767a] transition-colors hover:bg-[#FAFAFA]'>
                Cancel
              </Link>
              <button
                type='submit'
                className='inline-flex h-10 items-center rounded-lg bg-[#008C83] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#007A72]'
              >
                Create Supplier
              </button>
            </div>
          </form>
        </div>

        <div className='mt-5 rounded-xl border border-[#CFE7E5] bg-[#EAF9F7] p-4'>
          <p className='text-sm font-semibold text-[#1f7d76]'>What happens after creating a supplier?</p>
          <p className='mt-1 text-xs text-[#399089]'>Supplier will be available in Purchase & Supply module</p>
          <p className='mt-1 text-xs text-[#399089]'>All purchase orders will be automatically linked to this supplier</p>
          <p className='mt-1 text-xs text-[#399089]'>Outstanding amounts will be tracked automatically</p>
        </div>
      </div>
    </div>
  )
}

export default AddSupplierPage
