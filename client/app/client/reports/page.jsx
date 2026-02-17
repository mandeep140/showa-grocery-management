'use client'

import { useState } from 'react'
import { getReportContent, pillStyles, tabs } from './report-config'
import { DateRangeCard, FiltersCard, ReportTable, SummaryCards, TabsCard } from '@/component/ReportComponents'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const content = getReportContent(activeTab)

  return (
    <div className='min-h-screen bg-[#E6FFFD] px-5 pb-10 pt-20 md:px-10 md:pb-12'>
      <div className='mx-auto w-full max-w-245'>
        <header className='mb-6'>
          <h1 className='text-3xl font-semibold text-[#2F2F2F] sm:text-4xl'>Reports</h1>
          <p className='mt-2 text-sm text-[#7D8B8A]'>View business reports and analytics</p>
        </header>

        <DateRangeCard />
        <TabsCard tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <FiltersCard />
        <SummaryCards cards={content.cards} />
        <ReportTable content={content} pillStyles={pillStyles} />
      </div>
    </div>
  )
}