import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiPhone } from 'react-icons/fi'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { IoMdArrowBack } from 'react-icons/io'
import { MdCurrencyRupee, MdOutlineInventory2, MdOutlineLocalShipping } from 'react-icons/md'
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
      <div className='mx-auto w-full max-w-[980px]'>
        <div className='mb-5 flex items-start justify-between gap-3'>
          <div>
            <Link
              href='/client/purchase-supply'
              className='inline-flex items-center gap-1 text-sm text-[#6f8082] transition-colors hover:text-[#4b5a5c]'
            >
              <IoMdArrowBack className='text-sm' />
              Back to Suppliers
            </Link>
            <h1 className='mt-2.5 text-4xl font-semibold text-[#2F2F2F]'>Supplier Details</h1>
          </div>
          <button className='mt-2 inline-flex h-10 items-center rounded-lg bg-[#008C83] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#007A72]'>
            Edit Supplier
          </button>
        </div>

        <section className={`${cardClass} p-5 md:p-6`}>
          <div className='flex items-start justify-between'>
            <h2 className='text-base font-semibold text-[#2d3a3a]'>Basic Information</h2>
            <span className='inline-flex rounded-full bg-[#EAF8EF] px-2 py-0.5 text-xs font-semibold text-[#29985a]'>
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
                <FiPhone className='text-[#757575]' />
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
            <p className='mt-1 inline-flex items-start gap-1.5 text-[#2f3b43]'>
              <HiOutlineLocationMarker className='mt-0.5 text-[#757575]' />
              {supplier.address}
            </p>
          </div>

          <div className='mt-5 border-t border-[#eef1f2] pt-3 text-xs'>
            <p className='text-[#9aa3a8]'>Notes</p>
            <p className='mt-1 text-[#536066]'>{supplier.notes}</p>
          </div>
        </section>

        <section className='mt-4 grid gap-3 sm:grid-cols-3'>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-1.5 text-sm text-[#8f9b9f]'>
              <MdOutlineInventory2 className='text-[#61b6b2]' />
              Total Purchases
            </p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#1ca05f]'>{formatInr(history.totalPurchases)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Lifetime value</p>
          </article>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-1.5 text-sm text-[#8f9b9f]'>
              <MdOutlineLocalShipping className='text-[#66b4e4]' />
              Last Purchase
            </p>
            <p className='mt-2 text-sm font-semibold text-[#3d7fa6]'>{formatDate(history.lastPurchaseDate)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Most recent order</p>
          </article>
          <article className={`${cardClass} p-4`}>
            <p className='inline-flex items-center gap-1.5 text-sm text-[#8f9b9f]'>
              <MdCurrencyRupee className='text-[#ef7a72]' />
              Outstanding
            </p>
            <p className='mt-2 text-3xl font-semibold leading-none text-[#ef5c55]'>{formatInr(history.outstanding)}</p>
            <p className='mt-2 text-xs text-[#9aa3a8]'>Pending payments</p>
          </article>
        </section>

        <section className={`${cardClass} mt-4 overflow-hidden`}>
          <header className='border-b border-[#ECECEC] bg-[#F5F5F5] px-4 py-3 text-sm font-semibold text-[#3e4e53]'>
            Recent Purchases
          </header>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left'>
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

        <section className={`${cardClass} mt-4 overflow-hidden`}>
          <header className='border-b border-[#ECECEC] bg-[#F5F5F5] px-4 py-3 text-sm font-semibold text-[#3e4e53]'>
            Supplier Returns
          </header>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left'>
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
  )
}
