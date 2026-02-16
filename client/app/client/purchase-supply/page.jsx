'use client'

import Link from 'next/link'
import { FaPlus } from 'react-icons/fa6'
import { IoEyeOutline, IoSearch } from 'react-icons/io5'
import { MdEdit } from 'react-icons/md'
import { FiPhone } from 'react-icons/fi'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { formatInr, suppliers } from './data'

const cardClass = 'rounded-xl border border-[#DCE8E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
const primaryBtnClass =
  'inline-flex h-10 items-center gap-2 rounded-lg bg-[#008C83] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#007A72]'

const PurchaseSupplyPage = () => {
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'Active').length
  const totalOutstanding = suppliers.reduce((sum, supplier) => sum + supplier.outstanding, 0)

  return (
    <div className='min-h-screen bg-[#E6FFFD] px-5 pb-10 pt-20 md:px-10 md:pb-12'>
      <div className='mx-auto w-full max-w-[980px]'>
        <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-4xl font-semibold text-[#2F2F2F]'>Suppliers</h1>
            <p className='mt-2 text-sm text-[#7D8B8A]'>Manage supplier information and relationships</p>
          </div>

          <Link href='/client/purchase-supply/add' className={primaryBtnClass}>
            <FaPlus className='text-xs' />
            Add Supplier
          </Link>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <div className={`${cardClass} p-4`}>
            <p className='text-sm text-[#7D8B8A]'>Total Suppliers</p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#2b3b3f]'>{suppliers.length}</p>
          </div>
          <div className={`${cardClass} p-4`}>
            <p className='text-sm text-[#7D8B8A]'>Active Suppliers</p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#22a061]'>{activeSuppliers}</p>
          </div>
          <div className={`${cardClass} p-4`}>
            <p className='text-sm text-[#7D8B8A]'>Total Outstanding</p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#ef5c55]'>{formatInr(totalOutstanding)}</p>
          </div>
        </div>

        <div className={`${cardClass} mt-4 flex flex-col gap-2 p-3 sm:flex-row`}>
          <label className='flex h-11 w-full items-center gap-2 rounded-lg border border-[#E5E5E5] px-3 text-sm text-[#8b969a] sm:flex-1'>
            <IoSearch className='text-[#a3acb0]' />
            <input
              type='text'
              placeholder='Search by supplier name or phone number...'
              className='w-full bg-transparent text-sm text-[#3d4b50] outline-none placeholder:text-[#a8b1b5]'
            />
          </label>
          <select className='h-11 rounded-lg border border-[#E5E5E5] px-3 text-sm text-[#5f6a70] outline-none focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20 sm:w-44'>
            <option>All Suppliers</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className={`${cardClass} mt-4 overflow-hidden`}>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[820px] text-left'>
              <thead className='bg-[#F5F5F5] text-xs uppercase tracking-wide text-[#748087]'>
                <tr>
                  <th className='px-4 py-3 font-semibold'>Supplier Name</th>
                  <th className='px-4 py-3 font-semibold'>Phone Number</th>
                  <th className='px-4 py-3 font-semibold'>Address</th>
                  <th className='px-4 py-3 text-right font-semibold'>Outstanding Amount</th>
                  <th className='px-4 py-3 font-semibold'>Status</th>
                  <th className='px-4 py-3 text-center font-semibold'>Actions</th>
                </tr>
              </thead>
              {suppliers.length > 0 ? (
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
                      <td className='px-4 py-3.5 font-medium'>{supplier.name}</td>
                      <td className='whitespace-nowrap px-4 py-3.5 text-[#5f6a70]'>
                        <span className='inline-flex items-center gap-1.5'>
                          <FiPhone className='text-[#757575]' />
                          {supplier.phone}
                        </span>
                      </td>
                      <td className='px-4 py-3.5 text-[#5f6a70]'>
                        <span className='inline-flex items-center gap-1.5'>
                          <HiOutlineLocationMarker className='text-[#757575]' />
                          {supplier.address}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-semibold ${
                          supplier.outstanding > 0 ? 'text-[#ef5c55]' : 'text-[#22a061]'
                        }`}
                      >
                        {supplier.outstanding > 0 ? formatInr(supplier.outstanding) : 'Rs 0'}
                      </td>
                      <td className='px-4 py-3.5'>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            supplier.status === 'Active' ? 'bg-[#EAF8EF] text-[#29985a]' : 'bg-[#f3f4f6] text-[#7d868d]'
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td className='px-4 py-3.5'>
                        <div className='flex items-center justify-center gap-3 text-sm text-[#7f8a92]'>
                          <Link
                            href={`/client/purchase-supply/${supplier.id}`}
                            className='transition-colors hover:text-[#14a388]'
                            aria-label={`View ${supplier.name}`}
                          >
                            <IoEyeOutline />
                          </Link>
                          <button type='button' className='transition-colors hover:text-[#14a388]' aria-label='Edit supplier'>
                            <MdEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={6} className='px-6 py-14 text-center'>
                      <p className='text-base font-medium text-[#7D7D7D]'>No suppliers found</p>
                      <p className='mt-2 text-sm text-[#A1A1A1]'>Create a supplier to start tracking purchases and outstanding amounts.</p>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>

          <div className='flex items-center justify-between border-t border-[#ECECEC] px-4 py-3 text-xs text-[#8b8f92]'>
            <p>Showing 8 of 8 suppliers</p>
            <div className='flex items-center gap-1.5'>
              <button type='button' className='rounded-lg border border-[#dfe3e6] bg-white px-3 py-1.5 text-[#8b8f92]'>
                Previous
              </button>
              <button type='button' className='rounded-lg bg-[#008C83] px-3 py-1.5 text-white'>
                1
              </button>
              <button type='button' className='rounded-lg border border-[#dfe3e6] bg-white px-3 py-1.5 text-[#8b8f92]'>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseSupplyPage
