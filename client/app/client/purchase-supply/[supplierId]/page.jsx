import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiPhone } from 'react-icons/fi'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { IoMdArrowBack } from 'react-icons/io'
import { MdEdit } from 'react-icons/md'
import { formatInr, supplierPurchaseHistory, suppliers } from '../data'

const cardClass = 'rounded-xl border border-[#DCE8E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const statusClass = {
  Paid: 'bg-[#eaf8ef] text-[#29985a]',
  Pending: 'bg-[#fff5e8] text-[#d7832f]',
  Completed: 'bg-[#eaf8ef] text-[#29985a]',
}

export default async function SupplierDetailsPage({ params }) {
  const resolvedParams = await params
  const rawSupplierId = resolvedParams?.supplierId ?? ''
  const normalizedSupplierId = rawSupplierId.toLowerCase()
  const supplier = suppliers.find(
    (item) => item.id.toLowerCase() === normalizedSupplierId || item.supplierId.toLowerCase() === normalizedSupplierId
  )

  if (!supplier) {
    notFound()
  }

  const history = supplierPurchaseHistory[supplier.id] ?? {
    totalPurchases: 0,
    lastPurchaseDate: '2026-01-01',
    outstanding: supplier.outstanding,
    recentPurchases: [],
    returns: [],
  }

  return (
    <div className='min-h-screen bg-[#E6FFFD] px-5 pb-10 pt-20 md:px-10 md:pb-12'>
      <div className='mx-auto w-full max-w-245'>
        <div className='mb-7 flex items-center justify-between gap-3'>
          <div>
            <Link
              href='/client/purchase-supply'
              className='inline-flex items-center gap-1 text-sm text-[#6f8082] transition-colors hover:text-[#4b5a5c]'
            >
              <IoMdArrowBack className='text-sm' />
              Back to Suppliers
            </Link>
            <h1 className='mt-4 text-4xl font-semibold text-[#2F2F2F]'>Supplier Details</h1>
          </div>
          <button className='inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#008C83] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#007A72]'>
            <MdEdit className='text-base' />
            Edit Supplier
          </button>
        </div>

        <div className='space-y-5'>
        <section className={`${cardClass} p-5 md:p-6`}>
          <div className='flex items-start justify-between'>
            <h2 className='text-base font-semibold text-[#2d3a3a]'>Basic Information</h2>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-2 py-0.5 text-xs font-semibold text-[#29985a]'>
              <span className='h-2 w-2 rounded-full bg-[#4CAF50]' />
              {supplier.status}
            </span>
          </div>

          <div className='mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2'>
            <div>
              <p className='text-[#9aa3a8]'>Supplier Name</p>
              <p className='mt-1 font-semibold text-[#2f3b43]'>{supplier.name}</p>
            </div>
            <div>
              <p className='text-[#9aa3a8]'>Supplier ID</p>
              <p className='mt-1 font-semibold text-[#2f3b43]'>{supplier.supplierId}</p>
            </div>
            <div>
              <p className='text-[#9aa3a8]'>Phone Number</p>
              <p className='mt-1 inline-flex items-center gap-1.5 text-[#2f3b43]'>
                <FiPhone className='text-[#008C83]' />
                {supplier.phone}
              </p>
            </div>
            <div>
              <p className='text-[#9aa3a8]'>GST / Tax ID</p>
              <p className='mt-1 text-[#2f3b43]'>{supplier.gstTin}</p>
            </div>
          </div>

          <div className='mt-5 border-t border-[#eef1f2] pt-3 text-xs'>
            <p className='text-[#9aa3a8]'>Address</p>
            <p className='mt-1 inline-flex items-start gap-1.5 text-[15px] font-semibold leading-[22.5px] text-[#404040]'>
              <HiOutlineLocationMarker className='mt-0.5 text-[#008C83]' />
              {supplier.address}
            </p>
          </div>

          <div className='mt-5 border-t border-[#eef1f2] pt-3 text-xs'>
            <p className='text-[#9aa3a8]'>Notes</p>
            <p className='mt-1 text-[#536066]'>{supplier.notes}</p>
          </div>
        </section>

        <section className='grid gap-3 sm:grid-cols-3'>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-2 text-sm text-[#8f9b9f]'>
              <svg width='44' height='44' viewBox='0 0 44 44' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M0 10C0 4.47715 4.47715 0 10 0H34C39.5228 0 44 4.47715 44 10V34C44 39.5228 39.5228 44 34 44H10C4.47715 44 0 39.5228 0 34V10Z' fill='#E0F2F1' />
                <path d='M30.3337 17.8335L23.2503 24.9168L19.0837 20.7502L13.667 26.1668' stroke='#009688' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M25.333 17.8335H30.333V22.8335' stroke='#009688' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
              Total Purchases
            </p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#1ca05f]'>{formatInr(history.totalPurchases)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Lifetime value</p>
          </article>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-2 text-sm text-[#8f9b9f]'>
              <svg width='44' height='44' viewBox='0 0 44 44' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M0 10C0 4.47715 4.47715 0 10 0H34C39.5228 0 44 4.47715 44 10V34C44 39.5228 39.5228 44 34 44H10C4.47715 44 0 39.5228 0 34V10Z' fill='#E3F2FD' />
                <g clipPath='url(#clip0_218_5460)'>
                  <path d='M18.667 13.6665V16.9998' stroke='#2196F3' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M25.333 13.6665V16.9998' stroke='#2196F3' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M27.8333 15.3335H16.1667C15.2462 15.3335 14.5 16.0797 14.5 17.0002V28.6668C14.5 29.5873 15.2462 30.3335 16.1667 30.3335H27.8333C28.7538 30.3335 29.5 29.5873 29.5 28.6668V17.0002C29.5 16.0797 28.7538 15.3335 27.8333 15.3335Z' stroke='#2196F3' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M14.5 20.3335H29.5' stroke='#2196F3' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                </g>
                <defs>
                  <clipPath id='clip0_218_5460'>
                    <rect width='20' height='20' fill='white' transform='translate(12 12)' />
                  </clipPath>
                </defs>
              </svg>
              Last Purchase
            </p>
            <p className='mt-2 text-sm font-semibold text-[#2196F3]'>{formatDate(history.lastPurchaseDate)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Most recent order</p>
          </article>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-2 text-sm text-[#8f9b9f]'>
              <svg width='44' height='44' viewBox='0 0 44 44' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M0 10C0 4.47715 4.47715 0 10 0H34C39.5228 0 44 4.47715 44 10V34C44 39.5228 39.5228 44 34 44H10C4.47715 44 0 39.5228 0 34V10Z' fill='#FFEBEE' />
                <path d='M17 14.5H27' stroke='#F44336' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M17 18.6665H27' stroke='#F44336' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M17 22.8335L24.0833 29.5002' stroke='#F44336' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M17 22.8335H19.5' stroke='#F44336' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M19.5 22.8333C25.0558 22.8333 25.0558 14.5 19.5 14.5' stroke='#F44336' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
              Outstanding
            </p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#ef5c55]'>{formatInr(history.outstanding)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Pending payments</p>
          </article>
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <header className='border-b border-[#ECECEC] bg-[#F5F5F5] px-4 py-3 text-sm font-semibold text-[#3e4e53]'>
            <span className='inline-flex items-center gap-2'>
              <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M12.4997 1.6665H4.99967C4.55765 1.6665 4.13372 1.8421 3.82116 2.15466C3.5086 2.46722 3.33301 2.89114 3.33301 3.33317V16.6665C3.33301 17.1085 3.5086 17.5325 3.82116 17.845C4.13372 18.1576 4.55765 18.3332 4.99967 18.3332H14.9997C15.4417 18.3332 15.8656 18.1576 16.1782 17.845C16.4907 17.5325 16.6663 17.1085 16.6663 16.6665V5.83317L12.4997 1.6665Z' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M11.667 1.6665V4.99984C11.667 5.44186 11.8426 5.86579 12.1551 6.17835C12.4677 6.49091 12.8916 6.6665 13.3337 6.6665H16.667' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M8.33366 7.5H6.66699' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M13.3337 10.8335H6.66699' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M13.3337 14.1665H6.66699' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
              Recent Purchases
            </span>
          </header>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-190 text-left'>
              <thead className='bg-[#fcfcfc] text-xs uppercase text-[#748087]'>
                <tr>
                  <th className='px-4 py-2.5 font-semibold'>Invoice No.</th>
                  <th className='px-4 py-2.5 font-semibold'>Date</th>
                  <th className='px-4 py-2.5 text-right font-semibold'>Amount</th>
                  <th className='px-4 py-2.5 font-semibold'>Status</th>
                </tr>
              </thead>
              {history.recentPurchases.length > 0 ? (
                <tbody>
                  {history.recentPurchases.map((purchase) => (
                    <tr key={purchase.invoiceNo} className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
                      <td className='px-4 py-3.5 font-medium'>{purchase.invoiceNo}</td>
                      <td className='px-4 py-3.5 text-[#5f6a70]'>{formatDate(purchase.date)}</td>
                      <td className='px-4 py-3.5 text-right font-semibold text-[#1aa382]'>{formatInr(purchase.amount)}</td>
                      <td className='px-4 py-3.5'>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[purchase.status]}`}>
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={4} className='px-6 py-14 text-center'>
                      <p className='text-base font-medium text-[#7D7D7D]'>No purchase records</p>
                      <p className='mt-2 text-sm text-[#A1A1A1]'>Recent purchases for this supplier will appear here.</p>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          <footer className='border-t border-[#ECECEC] px-4 py-3 text-xs text-[#8b8f92]'>
            Showing {history.recentPurchases.length} recent purchases
          </footer>
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <header className='border-b border-[#ECECEC] bg-[#F5F5F5] px-4 py-3 text-sm font-semibold text-[#3e4e53]'>
            <span className='inline-flex items-center gap-2'>
              <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M2.5 10C2.5 11.4834 2.93987 12.9334 3.76398 14.1668C4.58809 15.4001 5.75943 16.3614 7.12987 16.9291C8.50032 17.4968 10.0083 17.6453 11.4632 17.3559C12.918 17.0665 14.2544 16.3522 15.3033 15.3033C16.3522 14.2544 17.0665 12.918 17.3559 11.4632C17.6453 10.0083 17.4968 8.50032 16.9291 7.12987C16.3614 5.75943 15.4001 4.58809 14.1668 3.76398C12.9334 2.93987 11.4834 2.5 10 2.5C7.90329 2.50789 5.89081 3.32602 4.38333 4.78333L2.5 6.66667' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M2.5 2.5V6.66667H6.66667' stroke='#008C83' strokeWidth='1.66667' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
              Supplier Returns
            </span>
          </header>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-190 text-left'>
              <thead className='bg-[#fcfcfc] text-xs uppercase text-[#748087]'>
                <tr>
                  <th className='px-4 py-2.5 font-semibold'>Return No.</th>
                  <th className='px-4 py-2.5 font-semibold'>Date</th>
                  <th className='px-4 py-2.5 font-semibold'>Reason</th>
                  <th className='px-4 py-2.5 text-right font-semibold'>Amount</th>
                  <th className='px-4 py-2.5 font-semibold'>Status</th>
                </tr>
              </thead>
              {history.returns.length > 0 ? (
                <tbody>
                  {history.returns.map((item) => (
                    <tr key={item.returnNo} className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
                      <td className='px-4 py-3.5 font-medium'>{item.returnNo}</td>
                      <td className='px-4 py-3.5 text-[#5f6a70]'>{formatDate(item.date)}</td>
                      <td className='px-4 py-3.5 text-[#5f6a70]'>{item.reason}</td>
                      <td className='px-4 py-3.5 text-right font-semibold text-[#ef5c55]'>-{formatInr(item.amount)}</td>
                      <td className='px-4 py-3.5'>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={5} className='px-6 py-14 text-center'>
                      <p className='text-base font-medium text-[#7D7D7D]'>No returns recorded</p>
                      <p className='mt-2 text-sm text-[#A1A1A1]'>Supplier return entries will be listed here.</p>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          <footer className='flex items-center justify-between border-t border-[#ECECEC] px-4 py-3 text-xs text-[#8b8f92]'>
            <p>Showing {history.returns.length} returns</p>
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
          </footer>
        </section>
        </div>
      </div>
    </div>
  )
}
