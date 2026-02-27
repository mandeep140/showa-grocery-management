'use client'

import { FiArrowDownLeft, FiArrowUpRight, FiDownload, FiMapPin, FiPhone, FiUser } from 'react-icons/fi'
import { getInitial } from '@/app/client/debts/credits-data'

const CreditDetailsPanel = ({ selectedCustomer, selectedTransactions, money, onReceivePayment }) => {
  return (
    <section className="p-0">
      {!selectedCustomer ? (
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#E6E8EB] bg-[#F7F8FA] text-[#B9C0C9]">
              <FiUser className="h-12 w-12" />
            </div>
            <h3 className="text-4xl font-semibold text-[#2F3640]">Select a Customer</h3>
            <p className="mt-4 max-w-155 text-xl leading-relaxed text-[#97A0AB]">
              Choose a customer from the list to view their credit history, outstanding balance, and manage payments.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-[#D9DEE4] bg-[#F4F5F6] px-6 py-5">
            <div className="flex flex-col gap-5 rounded-xl border border-[#E4E8ED] bg-white/90 p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] backdrop-blur-sm xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#089E97] text-3xl font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                  {getInitial(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="text-[48px] font-semibold leading-tight text-[#1E2938]">{selectedCustomer.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#7E8793]">
                    <span className="inline-flex items-center gap-1">
                      <FiUser className="h-4 w-4" />
                      {selectedCustomer.code}
                    </span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <FiPhone className="h-4 w-4" />
                      {selectedCustomer.phone}
                    </span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin className="h-4 w-4" />
                      {selectedCustomer.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="xl:text-right">
                <p className="text-sm text-[#7E8793]">Current Outstanding Balance</p>
                <p className={`text-[58px] font-bold leading-none ${selectedCustomer.due > 0 ? 'text-[#FF2E2E]' : 'text-[#0EAD5A]'}`}>
                  {money(selectedCustomer.due)}
                </p>
                <div className="mt-3 flex gap-3 xl:justify-end">
                  <button
                    type="button"
                    className="inline-flex h-14 items-center gap-2 rounded-xl border border-[#D6DAE0] bg-white px-5 text-sm font-semibold text-[#5F6D7D]"
                  >
                    <FiDownload className="h-4 w-4" />
                    Statement
                  </button>
                  <button
                    type="button"
                    onClick={onReceivePayment}
                    className="h-14 rounded-xl bg-[#0BA69C] px-6 text-sm font-semibold text-white"
                  >
                    Receive Payment
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-hidden rounded-2xl border border-[#DDE2E8] bg-[#F8FAFC]">
              <div className="flex items-center justify-between border-b border-[#E3E8EE] px-4 py-3">
                <h4 className="inline-flex items-center gap-2 text-3xl font-semibold text-[#2D3847]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5.33301 1.33301V3.99967" stroke="#6A7282" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.667 1.33301V3.99967" stroke="#6A7282" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.6667 2.66699H3.33333C2.59695 2.66699 2 3.26395 2 4.00033V13.3337C2 14.07 2.59695 14.667 3.33333 14.667H12.6667C13.403 14.667 14 14.07 14 13.3337V4.00033C14 3.26395 13.403 2.66699 12.6667 2.66699Z" stroke="#6A7282" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 6.66699H14" stroke="#6A7282" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Transaction History
                </h4>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="rounded-md bg-[#FFECEC] px-3 py-1 text-[#FF4B4B]">Debit (Purchase)</span>
                  <span className="rounded-md bg-[#E9F9EE] px-3 py-1 text-[#16A34A]">Credit (Payment)</span>
                </div>
              </div>

              {selectedTransactions.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="border-b border-[#E3E8EE] bg-[#F5F5F5] text-xs uppercase tracking-wide text-[#748087]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Txn ID</th>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-[#ECECEC] text-sm text-[#2f3b43] last:border-b-0">
                          <td className="px-4 py-3.5 text-[#5f6a70]">{new Date(txn.date).toLocaleDateString('en-CA')}</td>
                          <td className="px-4 py-3.5 text-[#5f6a70]">{txn.id}</td>
                          <td className="px-4 py-3.5 font-medium text-[#2f3b43]">{txn.description}</td>
                          <td className={`px-4 py-3.5 font-semibold ${txn.type === 'credit' ? 'text-[#16A34A]' : 'text-[#FF2E2E]'}`}>
                            {txn.type === 'credit' ? money(txn.amount) : `-${money(txn.amount)}`}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                                txn.type === 'credit' ? 'bg-[#EAF8EE] text-[#16A34A]' : 'bg-[#FFEFF0] text-[#FF4B4B]'
                              }`}
                            >
                              {txn.type === 'credit' ? (
                                <FiArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <FiArrowUpRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[#5f6a70]">{money(txn.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-12 text-center text-sm text-[#96A0AE]">No transactions available for this customer.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CreditDetailsPanel
