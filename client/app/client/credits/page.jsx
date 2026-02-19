'use client'

import { useMemo, useState } from 'react'
import CreditDetailsPanel from '@/component/CreditDetailsPanel'
import CreditHoldersPanel from '@/component/CreditHoldersPanel'
import ReceivePaymentModal from '@/component/ReceivePaymentModal'
import { creditHolders, money, transactionHistory } from './credits-data'

export default function CreditsPage() {
  const [query, setQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(creditHolders[0])
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  const filteredHolders = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) {
      return creditHolders
    }

    return creditHolders.filter((holder) =>
      holder.name.toLowerCase().includes(term) || holder.phone.includes(term)
    )
  }, [query])

  const totalOutstanding = useMemo(
    () => creditHolders.reduce((sum, holder) => sum + holder.due, 0),
    []
  )

  const selectedTransactions = selectedCustomer ? transactionHistory[selectedCustomer.id] ?? [] : []
  const numericPaymentAmount = Number(paymentAmount) || 0
  const remainingBalance = selectedCustomer ? Math.max(selectedCustomer.due - numericPaymentAmount, 0) : 0

  const handleReceivePaymentOpen = () => {
    setPaymentAmount('')
    setIsReceivePaymentOpen(true)
  }

  return (
    <div className="min-h-screen w-full bg-[#E6FFFD] px-6 pb-8 pt-18 xl:px-7">
      <div className="mx-auto max-w-350">
        <div className="grid min-h-[78vh] grid-cols-1 rounded-sm border border-[#DEE3E6] bg-[#F6F7F8] lg:grid-cols-[380px_1fr]">
          <CreditHoldersPanel
            query={query}
            onQueryChange={setQuery}
            holders={filteredHolders}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            totalOutstanding={totalOutstanding}
            money={money}
          />

          <CreditDetailsPanel
            selectedCustomer={selectedCustomer}
            selectedTransactions={selectedTransactions}
            money={money}
            onReceivePayment={handleReceivePaymentOpen}
          />
        </div>
      </div>

      <ReceivePaymentModal
        isOpen={isReceivePaymentOpen}
        selectedCustomer={selectedCustomer}
        paymentAmount={paymentAmount}
        remainingBalance={remainingBalance}
        onPaymentAmountChange={setPaymentAmount}
        onClose={() => setIsReceivePaymentOpen(false)}
        money={money}
      />
    </div>
  )
}
