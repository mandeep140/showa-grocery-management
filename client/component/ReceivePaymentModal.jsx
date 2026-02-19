'use client'

import { FiX } from 'react-icons/fi'

const ReceivePaymentModal = ({
  isOpen,
  selectedCustomer,
  paymentAmount,
  remainingBalance,
  onPaymentAmountChange,
  onClose,
  money,
}) => {
  if (!isOpen || !selectedCustomer) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-107.5 rounded-2xl border border-[#E2E7EE] bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-semibold text-[#1F2937]">Receive Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9AA5B1] transition-colors hover:text-[#6B7683]"
            aria-label="Close receive payment modal"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#CBEFEB] bg-[#EAF8F6] p-5 text-center">
          <p className="text-sm font-semibold text-[#4D7D86]">Current Due Amount</p>
          <p className={`mt-1 text-[42px] font-bold leading-none ${selectedCustomer.due > 0 ? 'text-[#0A857C]' : 'text-[#0EAD5A]'}`}>
            {money(selectedCustomer.due)}
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="paymentAmount" className="text-sm font-semibold text-[#5B6675]">
            Payment Amount ({'\u20B9'})
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[#7B8592]">
              {'\u20B9'}
            </span>
            <input
              id="paymentAmount"
              type="number"
              min="0"
              value={paymentAmount}
              onChange={(e) => onPaymentAmountChange(e.target.value)}
              className="h-14 w-full rounded-xl border border-[#E0E4EA] bg-[#FBFCFD] pl-10 pr-4 text-base text-[#2D3748] outline-none focus:border-[#93D1C9] focus:ring-2 focus:ring-[#93D1C9]/30"
            />
          </div>
          <p className="mt-2 text-sm text-[#8A95A3]">
            Remaining Balance: <span className="font-semibold text-[#606B79]">{money(remainingBalance)}</span>
          </p>
        </div>

        <button
          type="button"
          className="mt-6 h-14 w-full rounded-xl bg-[#0BA69C] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,166,156,0.25)]"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  )
}

export default ReceivePaymentModal
