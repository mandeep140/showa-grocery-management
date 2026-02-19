'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  HiMiniMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineUser,
  HiMinusSmall,
  HiPlusSmall,
  HiOutlineQrCode,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { BiPrinter } from 'react-icons/bi'
import { RiSecurePaymentLine } from 'react-icons/ri'

const CashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M16.667 5H3.33366C2.41318 5 1.66699 5.74619 1.66699 6.66667V13.3333C1.66699 14.2538 2.41318 15 3.33366 15H16.667C17.5875 15 18.3337 14.2538 18.3337 13.3333V6.66667C18.3337 5.74619 17.5875 5 16.667 5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.99967 11.6666C10.9201 11.6666 11.6663 10.9204 11.6663 9.99992C11.6663 9.07944 10.9201 8.33325 9.99967 8.33325C9.0792 8.33325 8.33301 9.07944 8.33301 9.99992C8.33301 10.9204 9.0792 11.6666 9.99967 11.6666Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10H5.00833M15 10H15.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UpiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5.83333 2.5H3.33333C2.8731 2.5 2.5 2.8731 2.5 3.33333V5.83333C2.5 6.29357 2.8731 6.66667 3.33333 6.66667H5.83333C6.29357 6.66667 6.66667 6.29357 6.66667 5.83333V3.33333C6.66667 2.8731 6.29357 2.5 5.83333 2.5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.6663 2.5H14.1663C13.7061 2.5 13.333 2.8731 13.333 3.33333V5.83333C13.333 6.29357 13.7061 6.66667 14.1663 6.66667H16.6663C17.1266 6.66667 17.4997 6.29357 17.4997 5.83333V3.33333C17.4997 2.8731 17.1266 2.5 16.6663 2.5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83333 13.3333H3.33333C2.8731 13.3333 2.5 13.7063 2.5 14.1666V16.6666C2.5 17.1268 2.8731 17.4999 3.33333 17.4999H5.83333C6.29357 17.4999 6.66667 17.1268 6.66667 16.6666V14.1666C6.66667 13.7063 6.29357 13.3333 5.83333 13.3333Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.4997 13.3333H14.9997C14.5576 13.3333 14.1337 13.5088 13.8212 13.8214C13.5086 14.134 13.333 14.5579 13.333 14.9999V17.4999" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 17.5V17.5083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.99967 5.83325V8.33325C9.99967 8.77528 9.82408 9.1992 9.51152 9.51176C9.19896 9.82432 8.77504 9.99992 8.33301 9.99992H5.83301" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 10H2.50833" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 2.5H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 13.3333V13.3416" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.333 10H14.1663" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 10V10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 17.5001V16.6667" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CreditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M16.667 4.16675H3.33366C2.41318 4.16675 1.66699 4.91294 1.66699 5.83341V14.1667C1.66699 15.0872 2.41318 15.8334 3.33366 15.8334H16.667C17.5875 15.8334 18.3337 15.0872 18.3337 14.1667V5.83341C18.3337 4.91294 17.5875 4.16675 16.667 4.16675Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.66699 8.33325H18.3337" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const products = [
  { id: 'SHM-TSL001', name: 'Tata Salt 1kg', price: 25, stock: 45, image: '/image/products/tata-salt.jpg' },
  { id: 'SHM-AMB002', name: 'Amul Butter 500g', price: 240, stock: 8, image: '/image/products/amul-butter.jpg' },
  { id: 'SHM-BRP003', name: 'Basmati Rice Premium', price: 150, stock: 0, image: '/image/products/basmati-rice.jpg' },
  { id: 'SHM-FOI004', name: 'Fortune Oil 1L', price: 145, stock: 32, image: '/image/products/fortune-oil.jpg' },
  { id: 'SHM-MGN005', name: 'Maggi Noodles', price: 12, stock: 12, image: '/image/products/maggie.jpg' },
  { id: 'SHM-DMC006', name: 'Dairy Milk Chocolate', price: 40, stock: 65, image: '/image/products/dairy-milk.jpg' },
  { id: 'SHM-PGB008', name: 'Parle-G Biscuits', price: 5, stock: 7, image: '/image/products/parle-g.jpg' },
  { id: 'SHM-PEP009', name: 'Pepsi 2L', price: 90, stock: 28, image: '/image/products/pepsi.jpg' },
]

const cartItems = [
  { name: 'Pepsi 2L', price: 90, quantity: 1 },
  { name: 'Fortune Oil 1L', price: 145, quantity: 1 },
]

const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
const tax = subtotal * 0.18
const total = subtotal + tax

export default function BillingPage() {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false)
    setCustomerForm({ name: '', phone: '', address: '' })
  }

  const saveAndSelectCustomer = () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return
    setSelectedCustomer(customerForm.name.trim())
    closeCustomerModal()
  }

  const canSaveCustomer = Boolean(customerForm.name.trim() && customerForm.phone.trim())
  const nunitoSans = { fontFamily: '"Nunito Sans", sans-serif' }

  return (
    <div className="min-h-screen bg-[#E8F2F1] px-5 pb-6 pt-5 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mb-10 flex h-10 items-center px-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0D9B94]">
          Sahyog <span className="font-semibold text-[#2B3C43]">Home Mart</span>
        </h1>
      </div>

      <div className="mx-auto mt-2 rounded-2xl border border-[#D6E3E2] bg-[#ECF4F3] p-4 shadow-[0_18px_30px_-24px_rgba(39,95,92,0.45)]">
        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <section className="rounded-xl border border-[#D9E5E4] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E2E9E8] bg-[#F8FBFB] px-3 py-2.5">
              <HiMiniMagnifyingGlass className="h-5 w-5 text-[#97A9AE]" />
              <input
                type="text"
                placeholder="Search products or scan barcode (Press Enter)..."
                className="w-full bg-transparent text-sm text-[#2B3C43] outline-none placeholder:text-[#A6B5B8]"
              />
              <button className="rounded-lg p-1.5 text-[#93A5A8] transition hover:bg-[#EAF2F1] hover:text-[#51777E]">
                <HiOutlineQrCode className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex h-[224px] w-full flex-col rounded-xl border-[0.8px] border-[#E2E9E8] bg-[#FCFEFE] p-2.5 shadow-[0_1px_2px_rgba(20,30,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-16px_rgba(23,90,96,0.65)]"
                >
                  <div className="relative mb-2 h-24 overflow-hidden rounded-[10px]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 220px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#142326]/20 via-transparent to-transparent" />
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-[#F2FBFA] px-2 py-0.5 text-[12px] font-semibold text-[#0D9B94]">
                      Rs {product.price}
                    </span>
                  </div>

                  <h3 className="min-h-[54px] text-xl font-semibold leading-[1.2] text-[#2B3C43]">{product.name}</h3>
                  <p className="mt-1 text-[12px] font-medium tracking-wide text-[#87989D]">{product.id}</p>
                  <p className="mt-0.5 text-[13px] text-[#4A5E64]">Stock: {product.stock}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-[#D9E5E4] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="border-b border-[#E7EEED] p-4">
              <div className="mb-3 flex gap-2">
                <div
                  className={`flex h-10 w-full items-center gap-2 rounded-lg px-3 ${
                    paymentMode === 'credit' ? 'border-[0.8px] border-[#FFB86A]' : 'border border-[#E0E8E7]'
                  }`}
                >
                  <HiOutlineUser className="h-4 w-4 text-[#93A5AA]" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm outline-none"
                    value={selectedCustomer}
                    readOnly
                    placeholder="Select customer"
                  />
                </div>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DDF6F3] text-[#0D9B94]"
                  onClick={() => {
                    setPaymentMode('credit')
                    setIsCustomerModalOpen(true)
                  }}
                >
                  <HiOutlineUserPlus className="h-5 w-5" />
                </button>
              </div>

              {paymentMode === 'credit' && (
                <p className="mb-3 text-sm font-medium text-[#D16F3D]">Select a customer for credit payment</p>
              )}

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.name} className="rounded-xl border border-[#E1EAE9] bg-[#FCFEFE] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-medium text-[#2F3F45]">{item.name}</p>
                        <p className="mt-1 text-sm text-[#788A8F]">
                          Rs {item.price} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E4EBEA] bg-white text-[#95A6AA]">
                          <HiMinusSmall />
                        </button>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E4EBEA] bg-white text-[#95A6AA]">
                          <HiPlusSmall />
                        </button>
                      </div>
                      <p className="min-w-14 text-right text-2xl font-semibold text-[#2D3B42]">Rs {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-[#E7EEED] p-4 text-[15px] text-[#677C82]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax (18%)</span>
                <span>Rs {tax.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[36px] font-semibold text-[#2D3B42]">Total</span>
                <span className="text-[42px] font-bold text-[#0D9B94]">Rs {total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-3 justify-items-center gap-2.5 pt-3">
                <button
                  className={`flex h-[57.5875px] w-[117.325px] flex-col items-center justify-center gap-1 rounded-[8px] pb-0 text-[13px] ${
                    paymentMode === 'cash'
                      ? 'border-[0.8px] border-[#B6E6D6] bg-[#E6F5EE] font-semibold text-[#269661]'
                      : 'border-[0.8px] border-[#E0E9E8] bg-[#F7FAFA] font-medium text-[#82969A]'
                  }`}
                  onClick={() => setPaymentMode('cash')}
                >
                  <CashIcon />
                  Cash
                </button>
                <button
                  className={`flex h-[57.5875px] w-[117.325px] flex-col items-center justify-center gap-1 rounded-[8px] pb-0 text-[13px] ${
                    paymentMode === 'upi'
                      ? 'border-[0.8px] border-[#B6D6E6] bg-[#EAF4FC] font-semibold text-[#2A6F9A]'
                      : 'border-[0.8px] border-[#E0E9E8] bg-[#F7FAFA] font-medium text-[#82969A]'
                  }`}
                  onClick={() => setPaymentMode('upi')}
                >
                  <UpiIcon />
                  UPI
                </button>
                <button
                  className={`flex h-[57.5875px] w-[117.325px] flex-col items-center justify-center gap-1 rounded-[8px] pb-0 text-[13px] ${
                    paymentMode === 'credit'
                      ? 'border-[0.8px] border-[#E3C3B5] bg-[#FFF3EC] font-semibold text-[#B15C35]'
                      : 'border-[0.8px] border-[#E0E9E8] bg-[#F7FAFA] font-medium text-[#82969A]'
                  }`}
                  onClick={() => setPaymentMode('credit')}
                >
                  <CreditIcon />
                  Credit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3">
                <button className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DFE8E7] bg-[#F4F7F7] text-base font-semibold text-[#6E8186]">
                  <BiPrinter className="h-5 w-5" />
                  Print
                </button>
                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#079A93] text-base font-semibold text-white transition hover:bg-[#048A84]">
                  <RiSecurePaymentLine className="h-5 w-5" />
                  Pay and Save
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#00000066] px-4">
          <div className="w-full max-w-[760px] rounded-3xl border border-[#DCE5E4] bg-white px-7 py-6 shadow-[0_30px_80px_-28px_rgba(15,34,40,0.6)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[20px] leading-7 font-bold text-[#1F2B38]" style={nunitoSans}>
                Add New Customer
              </h2>
              <button
                className="rounded-lg p-1 text-[#A3AFB3] transition hover:bg-[#F0F4F4] hover:text-[#6E7B81]"
                onClick={closeCustomerModal}
              >
                <HiOutlineXMark className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[14px] leading-5 font-medium text-[#4C5D67]" style={nunitoSans}>
                  Customer Name *
                </label>
                <input
                  className="h-14 w-full rounded-xl border border-[#DFE6E7] px-4 text-xl outline-none focus:border-[#56A291]"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] leading-5 font-medium text-[#4C5D67]" style={nunitoSans}>
                  Phone Number *
                </label>
                <input
                  className="h-14 w-full rounded-xl border border-[#DFE6E7] px-4 text-xl outline-none focus:border-[#56A291]"
                  value={customerForm.phone}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] leading-5 font-medium text-[#4C5D67]" style={nunitoSans}>
                  Address (Optional)
                </label>
                <textarea
                  className="h-24 w-full resize-none rounded-xl border border-[#DFE6E7] px-4 py-3 text-xl outline-none focus:border-[#56A291]"
                  value={customerForm.address}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, address: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[#DDE5E6] bg-[#F5F8F8] px-6 text-[14px] font-semibold text-[#5D6E75] transition-all duration-200 hover:bg-[#EDF3F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9BB5B2]/40"
                onClick={closeCustomerModal}
              >
                Cancel
              </button>
              <button
                className={`h-10 w-[131.475px] rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                  canSaveCustomer
                    ? 'bg-[#099D95] text-white shadow-[0_12px_24px_-14px_rgba(9,157,149,0.9)] hover:bg-[#068C85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#099D95]/40'
                    : 'cursor-not-allowed bg-[#B8DAD7] text-white/80'
                }`}
                onClick={saveAndSelectCustomer}
                disabled={!canSaveCustomer}
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
