'use client'

import { CiSearch } from 'react-icons/ci'
import { getAccent, getInitial } from '@/app/client/credits/credits-data'

const CreditHoldersPanel = ({
  query,
  onQueryChange,
  holders,
  selectedCustomer,
  onSelectCustomer,
  totalOutstanding,
  money,
}) => {
  return (
    <aside className="border-r border-[#E8ECEF]">
      <div className="border-b border-[#E8ECEF] bg-[#F4F5F6] p-4">
        <h2 className="text-[18px] font-bold leading-7 tracking-[0px] text-[#333B45]">Credit Holders</h2>
        <p className="mt-1 text-sm font-semibold text-[#7E8793]">
          Total Outstanding:
          <span className="ml-1 text-[#FF2E2E]">{money(totalOutstanding)}</span>
        </p>

        <div className="relative mt-3">
          <CiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8B0BA]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name or phone"
            className="h-11 w-full rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-sm outline-none focus:border-[#8DC7BC] focus:ring-2 focus:ring-[#8DC7BC]/30"
          />
        </div>
      </div>

      <div className="h-[64vh] overflow-y-auto">
        {holders.map((holder) => {
          const accent = getAccent(holder.due)
          const isSelected = selectedCustomer?.id === holder.id

          return (
            <button
              key={holder.id}
              type="button"
              onClick={() => onSelectCustomer(holder)}
              className={`flex w-full items-center gap-3 border-b border-[#EFF2F5] px-4 py-3.5 text-left transition-colors ${
                isSelected ? 'bg-[#E5F4F0]' : 'bg-[#F7F8F9] hover:bg-[#EEF3F7]'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-semibold ${accent.avatar}`}
              >
                {getInitial(holder.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-5 tracking-normal text-[#2F3640]">{holder.name}</p>
                <p className="mt-1 text-sm text-[#8E96A2]">{holder.phone}</p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-semibold ${accent.amount}`}>{money(holder.due)}</p>
                <p className="text-xs text-[#9AA3AF]">Due Amount</p>
              </div>
            </button>
          )
        })}

        {!holders.length && <div className="px-4 py-8 text-center text-sm text-[#95A0AE]">No customers found for this search.</div>}
      </div>
    </aside>
  )
}

export default CreditHoldersPanel
