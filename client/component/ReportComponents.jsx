import { FiCalendar } from 'react-icons/fi'
import { LuFileOutput, LuFilter } from 'react-icons/lu'

const cardClass = 'rounded-xl border border-[#DCE8E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
const inputClass = 'h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm text-[#2f3b43] outline-none placeholder:text-[#a3adb2] focus:border-[#33B4B1] focus:ring-2 focus:ring-[#33B4B1]/20'
const figmaShadowClass = 'shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]'

export function DateRangeCard() {
  return (
    <section className={`rounded-xl border border-[#DCE8E7] bg-white p-4 ${figmaShadowClass}`}>
      <p className='flex items-center gap-2 text-sm font-semibold text-[#4B5A59]'>
        <FiCalendar className='h-4 w-4 text-[#4EA9A1]' />
        Date Range
      </p>
      <div className='mt-3 flex flex-wrap gap-2'>
        <DateButton active>Today</DateButton>
        <DateButton>Yesterday</DateButton>
        <DateButton>Last 7 Days</DateButton>
        <DateButton>Custom Range</DateButton>
      </div>
    </section>
  )
}

export function TabsCard({ tabs, activeTab, setActiveTab }) {
  return (
    <section className='mt-4 overflow-hidden rounded-xl border border-[#DCE8E7] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]'>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-12 w-full items-center justify-center gap-2 border-b-4 px-3 text-center text-xs font-bold sm:h-[58.5px] sm:px-4 sm:text-sm lg:text-[15px] lg:leading-[22.5px] ${
                active ? 'border-b-[#008C83] bg-[#E7FAF8] text-[#008C83]' : 'border-b-transparent text-[#7F8A89] hover:bg-[#FAFCFC]'
              }`}
            >
              <Icon className='h-3.5 w-3.5' />
              {tab.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function FiltersCard() {
  return (
    <section className={`mt-4 rounded-xl border border-[#DCE8E7] bg-white p-5 ${figmaShadowClass}`}>
      <p className='mb-3 flex items-center gap-2 text-sm font-semibold text-[#4B5A59]'>
        <LuFilter className='h-4 w-4 text-[#4EA9A1]' />
        Filters
      </p>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <input type='text' placeholder='Category' className={inputClass} />
        <input type='text' placeholder='Product' className={inputClass} />
      </div>
    </section>
  )
}

export function SummaryCards({ cards }) {
  return (
    <section className={`mt-5 grid gap-4 ${cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
      {cards.map((card) => (
        <div key={card.label} className='min-h-27.5 rounded-[10px] border border-[#DCE8E7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
          <p className='text-sm text-[#7D8B8A]'>{card.label}</p>
          <p className={`mt-2 text-3xl font-semibold leading-none ${card.className}`}>{card.value}</p>
        </div>
      ))}
    </section>
  )
}

export function ReportTable({ content, pillStyles }) {
  return (
    <section className={`${cardClass} mt-5 overflow-hidden`}>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECEC] bg-[#F5F5F5] px-4 py-3'>
        <p className='text-sm font-semibold text-[#2C2C2C]'>{content.title}</p>
        <div className='flex w-full gap-2 sm:w-auto'>
          <button className='inline-flex h-[37px] w-full items-center justify-center gap-1 rounded-[10px] bg-[#4CAF50] px-3 text-xs font-semibold text-white sm:w-auto'>
            <LuFileOutput className='h-3.5 w-3.5' />
            Export CSV
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] text-left sm:min-w-[860px]'>
          <thead className='bg-[#F5F5F5] text-xs uppercase tracking-wide text-[#748087]'>
            <tr>
              {content.headers.map((header, idx) => (
                <th key={header} className={`px-4 py-3 font-semibold ${idx === content.headers.length - 1 ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{content.rows.map((row) => <DataRow key={getRowKey(content.type, row)} type={content.type} row={row} pillStyles={pillStyles} />)}</tbody>
        </table>
      </div>

      <div className='border-t border-[#ECECEC] px-4 py-3 text-xs text-[#8b8f92]'>{content.countLabel}</div>
    </section>
  )
}

function DateButton({ children, active = false }) {
  return (
    <button className={`h-9 rounded-lg border px-4 text-sm ${active ? 'border-[#24A9A2] bg-[#E8F7F6] font-semibold text-[#168D86]' : 'border-[#E2E7E6] bg-white text-[#7D8B8A]'}`}>
      {children}
    </button>
  )
}

function StatusPill({ text, pillStyles }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pillStyles[text]}`}>{text}</span>
}

function DataRow({ type, row, pillStyles }) {
  if (type === 'inventory') {
    return (
      <tr className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
        <td className='px-4 py-3.5 font-medium'>{row.product}</td>
        <td className='px-4 py-3.5 text-[#5f6a70]'>{row.category}</td>
        <td className='px-4 py-3.5 font-semibold'>{row.availableStock}</td>
        <td className='px-4 py-3.5 text-[#5f6a70]'>{row.minimumStock}</td>
        <td className='px-4 py-3.5'><StatusPill text={row.status} pillStyles={pillStyles} /></td>
      </tr>
    )
  }
  if (type === 'purchase') {
    return (
      <tr className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
        <td className='px-4 py-3.5 font-medium text-[#14a388]'>{row.invoice}</td>
        <td className='px-4 py-3.5 text-[#5f6a70]'>{row.supplier}</td>
        <td className='px-4 py-3.5'>{row.date}</td>
        <td className='px-4 py-3.5 font-semibold'>{row.items}</td>
        <td className='px-4 py-3.5'><StatusPill text={row.status} pillStyles={pillStyles} /></td>
        <td className='px-4 py-3.5 text-right font-semibold'>{row.amount}</td>
      </tr>
    )
  }
  if (type === 'loss') {
    return (
      <tr className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
        <td className='px-4 py-3.5 font-medium'>{row.product}</td>
        <td className='px-4 py-3.5 text-[#5f6a70]'>{row.category}</td>
        <td className='px-4 py-3.5 font-semibold'>{row.quantity}</td>
        <td className='px-4 py-3.5 text-[#ef5c55]'>{row.reason}</td>
        <td className='px-4 py-3.5 text-right font-semibold text-[#ef5c55]'>{row.amount}</td>
      </tr>
    )
  }
  return (
    <tr className='border-t border-[#ECECEC] text-sm text-[#2f3b43]'>
      <td className='px-4 py-3.5 font-medium text-[#14a388]'>{row.billNumber}</td>
      <td className='px-4 py-3.5'>
        <p className='font-medium'>{row.date}</p>
        <p className='text-xs text-[#9aa3a8]'>{row.time}</p>
      </td>
      <td className='px-4 py-3.5 text-[#5f6a70]'>{row.items}</td>
      <td className='px-4 py-3.5'><StatusPill text={row.payment} pillStyles={pillStyles} /></td>
      <td className='px-4 py-3.5 text-right font-semibold'>{row.amount}</td>
    </tr>
  )
}

function getRowKey(type, row) {
  if (type === 'sales') return row.billNumber
  if (type === 'inventory') return row.product
  if (type === 'purchase') return row.invoice
  return `${row.product}-${row.reason}`
}
