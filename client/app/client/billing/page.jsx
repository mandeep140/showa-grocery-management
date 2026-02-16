'use client'

import { CiSearch } from 'react-icons/ci'
import { FaFileAlt } from 'react-icons/fa'
import { IoClose, IoPauseSharp } from 'react-icons/io5'

const billingData = {
  totalItems: 0,
  subtotal: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxAmount: 0,
  grandTotal: 0,
  amountReceived: 0,
}

const actionButtons = [
  {
    label: 'Hold Bill',
    icon: IoPauseSharp,
    className: 'bg-[#FFF6E8] text-[#DCA14A] border-[#F6E3C0]',
  },
  {
    label: 'Print',
    icon: FaFileAlt,
    className: 'bg-[#ECF6FF] text-[#3F97E8] border-[#D8EAFD]',
  },
  {
    label: 'Cancel',
    icon: IoClose,
    className: 'bg-[#FFF1F1] text-[#E58A8A] border-[#F7DBDB]',
  },
]

const money = (value) => `\u20B9${value.toFixed(2)}`

export default function BillingPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#E6FFFD] px-8 pb-12 pt-20 xl:px-14">
      <div className="mx-auto max-w-295">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold text-[#2F2F2F]">Billing</h1>
          <p className="mt-2 text-sm text-[#7D8B8A]">Point of Sale - Fast checkout</p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
          <section className="space-y-5">
            <div className="rounded-xl border border-[#DCE8E7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <p className="text-sm font-medium text-[#505050]">Scan Barcode / Enter Product Code</p>
              <div className="mt-3 flex gap-3">
                <input
                  type="text"
                  placeholder="Scan or type barcode..."
                  className="h-11 w-full rounded-lg border border-[#33B4B1] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#33B4B1]/35"
                />
                <button className="h-11 rounded-lg bg-[#008C83] px-6 text-sm font-medium text-white hover:bg-[#007A72]">
                  Add
                </button>
              </div>

              <p className="mt-4 text-sm font-medium text-[#505050]">Or Search Product</p>
              <div className="relative mt-3">
                <CiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A6A6A6]" />
                <input
                  type="text"
                  placeholder="Search by product name..."
                  className="h-11 w-full rounded-lg border border-[#E5E5E5] pl-9 pr-3 text-sm text-[#222] outline-none focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#DCE8E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="border-b border-[#ECECEC] px-5 py-3">
                <h2 className="text-2xl font-semibold text-[#3A3A3A]">Bill Items ({billingData.totalItems})</h2>
              </div>
              <div className="flex min-h-82.5 flex-col items-center justify-center px-5 py-8 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F4F4]">
                  <CiSearch className="h-7 w-7 text-[#CDD3D2]" />
                </div>
                <p className="text-base font-medium text-[#7D7D7D]">No items in bill</p>
                <p className="mt-2 text-sm text-[#A1A1A1]">Scan barcode or search to add products</p>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border border-[#DCE8E7] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="text-3xl font-semibold text-[#3A3A3A]">Bill Summary</h2>

              <div className="mt-4 space-y-3 text-sm text-[#525252]">
                <div className="flex items-center justify-between">
                  <span>Total Items</span>
                  <span className="font-medium">{billingData.totalItems}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{money(billingData.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={billingData.discountPercent}
                      readOnly
                      className="h-7 w-12 rounded border border-[#E3E3E3] bg-[#FAFAFA] px-2 text-center text-xs"
                    />
                    <span className="text-xs">%</span>
                    <span className="font-medium text-[#E46666]">-{money(billingData.discountAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Tax (GST 5%)</span>
                  <span className="font-medium">{money(billingData.taxAmount)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#EFEFEF] pt-4">
                <span className="text-2xl font-semibold text-[#2E2E2E]">Grand Total</span>
                <span className="text-4xl font-bold text-[#008C83]">{money(billingData.grandTotal)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#DCE8E7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="text-3xl font-semibold text-[#3A3A3A]">Payment</h2>
              <p className="mt-4 text-sm text-[#525252]">Amount Received</p>
              <div className="mt-2 flex h-12 items-center rounded-lg border border-[#DCDCDC] px-3 text-[#8A8A8A]">
                <span className="mr-2 text-sm">{'\u20B9'}</span>
                <input
                  type="text"
                  value={billingData.amountReceived.toFixed(2)}
                  readOnly
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#DCE8E7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <button
                disabled
                className="h-12 w-full cursor-not-allowed rounded-lg bg-[#D2D2D2] text-sm font-semibold text-white"
              >
                Complete Sale
              </button>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {actionButtons.map(({ label, icon: Icon, className }) => (
                  <button
                    key={label}
                    className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-medium ${className}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
