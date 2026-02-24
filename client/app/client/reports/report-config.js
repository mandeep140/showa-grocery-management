import { InventoryReportIcon, LossReportIcon, PurchaseReportIcon, SalesReportIcon, ReturnsReportIcon } from './report-icons'

export const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const tabs = [
  { id: 'sales', label: 'Sales Report', icon: SalesReportIcon },
  { id: 'inventory', label: 'Inventory Report', icon: InventoryReportIcon },
  { id: 'purchase', label: 'Purchase Report', icon: PurchaseReportIcon },
  { id: 'returns', label: 'Returns', icon: ReturnsReportIcon },
  { id: 'loss', label: 'Loss Report', icon: LossReportIcon },
]

export const pillStyles = {
  Cash: 'bg-[#EAF8EE] text-[#29985a]',
  cash: 'bg-[#EAF8EE] text-[#29985a]',
  UPI: 'bg-[#E9F3FE] text-[#5F9DDA]',
  upi: 'bg-[#E9F3FE] text-[#5F9DDA]',
  Card: 'bg-[#FFF2DF] text-[#DAA04D]',
  credit: 'bg-[#FFF2DF] text-[#DAA04D]',
  'In Stock': 'bg-[#EAF8EE] text-[#29985a]',
  'Low Stock': 'bg-[#FFF2DF] text-[#DAA04D]',
  'Out of Stock': 'bg-[#FFE8E8] text-[#DA6A6A]',
  Paid: 'bg-[#EAF8EE] text-[#29985a]',
  paid: 'bg-[#EAF8EE] text-[#29985a]',
  Pending: 'bg-[#FFF2DF] text-[#DAA04D]',
  pending: 'bg-[#FFF2DF] text-[#DAA04D]',
  partial: 'bg-[#E9F3FE] text-[#5F9DDA]',
  expired: 'bg-[#FFE8E8] text-[#DA6A6A]',
  damaged: 'bg-[#FFF2DF] text-[#DAA04D]',
  lost: 'bg-[#FFE8E8] text-[#DA6A6A]',
  Cash: 'bg-[#EAF8EE] text-[#29985a]',
  'Debt Reduce': 'bg-[#FFF2DF] text-[#DAA04D]',
  Advance: 'bg-[#E9F3FE] text-[#5F9DDA]',
}

export function buildSalesContent(orders, summary) {
  const cards = [
    { label: 'Total Orders', value: String(summary?.total_orders ?? 0), className: 'text-[#2b3b3f]' },
    { label: 'Gross Sales', value: money(summary?.gross_sales ?? summary?.total_sales), className: 'text-[#14a388]' },
    { label: 'Profit', value: money(summary?.total_profit), className: 'text-[#22a061]' },
  ]
  if (summary?.total_returns > 0) {
    cards.push({ label: 'Returns', value: `-${money(summary.total_returns)}`, className: 'text-[#ef5c55]' })
    cards.push({ label: 'Net Sales', value: money(summary.total_sales), className: 'text-[#008C83]' })
  }
  return {
    type: 'sales',
    title: 'Sales Report Data',
    cards,
    headers: ['INVOICE', 'DATE & TIME', 'CUSTOMER', 'PAYMENT', 'TOTAL'],
    countLabel: `Showing ${orders.length} records`,
    rows: orders.map(o => ({
      billNumber: o.invoice_id,
      date: new Date(o.created_at + ' UTC').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date(o.created_at + ' UTC').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: o.buyer_name || 'Walk-in',
      payment: o.payment_method || 'cash',
      amount: money(o.final_amount),
    })),
  }
}

export function buildInventoryContent(products, summary) {
  return {
    type: 'inventory',
    title: 'Inventory Report Data',
    cards: [
      { label: 'Total Products', value: String(summary?.total_products ?? 0), className: 'text-[#2b3b3f]' },
      { label: 'In Stock', value: String(summary?.in_stock ?? 0), className: 'text-[#22a061]' },
      { label: 'Low / Out of Stock', value: `${summary?.low_stock ?? 0} / ${summary?.out_of_stock ?? 0}`, className: 'text-[#ef5c55]' },
    ],
    headers: ['PRODUCT', 'CATEGORY', 'AVAILABLE', 'MIN STOCK', 'STATUS'],
    countLabel: `Showing ${products.length} records`,
    rows: products.map(p => ({
      product: p.name,
      category: p.category_name || '—',
      availableStock: p.total_stock ?? 0,
      minimumStock: p.minimum_stock_level ?? 0,
      status: p.stock_status || (p.total_stock <= 0 ? 'Out of Stock' : p.total_stock <= (p.minimum_stock_level || 0) ? 'Low Stock' : 'In Stock'),
    })),
  }
}

export function buildPurchaseContent(purchases, summary) {
  return {
    type: 'purchase',
    title: 'Purchase Report Data',
    cards: [
      { label: 'Total Purchases', value: String(summary?.total_purchases ?? 0), className: 'text-[#2b3b3f]' },
      { label: 'Total Amount', value: money(summary?.total_amount), className: 'text-[#22a061]' },
      { label: 'Pending', value: money(summary?.total_pending), className: 'text-[#ef5c55]' },
    ],
    headers: ['INVOICE', 'SUPPLIER', 'DATE', 'ITEMS', 'STATUS', 'AMOUNT'],
    countLabel: `Showing ${purchases.length} records`,
    rows: purchases.map(p => ({
      invoice: p.invoice_number || `PUR-${p.id}`,
      supplier: p.seller_name || '—',
      date: new Date(p.created_at + ' UTC').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: p.total_items ?? '—',
      status: p.payment_status || 'pending',
      amount: money(p.final_amount),
    })),
  }
}

export function buildLossContent(disposals) {
  const totalLoss = disposals.reduce((s, d) => s + ((d.buying_rate || 0) * (d.quantity || 0)), 0)
  const totalUnits = disposals.reduce((s, d) => s + (d.quantity || 0), 0)
  return {
    type: 'loss',
    title: 'Loss Report Data',
    cards: [
      { label: 'Total Records', value: String(disposals.length), className: 'text-[#2b3b3f]' },
      { label: 'Total Loss', value: money(totalLoss), className: 'text-[#ef5c55]' },
      { label: 'Lost Units', value: String(totalUnits), className: 'text-[#ef5c55]' },
    ],
    headers: ['PRODUCT', 'BATCH', 'QUANTITY', 'REASON', 'LOSS AMOUNT'],
    countLabel: `Showing ${disposals.length} records`,
    rows: disposals.map(d => ({
      product: d.product_name || '—',
      category: d.batch_no || `#${d.batch_id}`,
      quantity: d.quantity,
      reason: d.disposal_method || '—',
      amount: money((d.buying_rate || 0) * (d.quantity || 0)),
    })),
  }
}

export function buildReturnsContent(returns, summary) {
  const methodLabel = { cash: 'Cash', debt_reduce: 'Debt Reduce', advance: 'Advance' }
  return {
    type: 'returns',
    title: 'Returns Report Data',
    cards: [
      { label: 'Total Returns', value: String(summary?.total_returns ?? 0), className: 'text-[#2b3b3f]' },
      { label: 'Return Amount', value: money(summary?.total_amount), className: 'text-[#ef5c55]' },
      { label: 'Cash / Debt / Advance', value: `${summary?.cash_refunds ?? 0} / ${summary?.debt_adjustments ?? 0} / ${summary?.advance_credits ?? 0}`, className: 'text-[#5F9DDA]' },
    ],
    headers: ['RETURN #', 'DATE', 'CUSTOMER', 'METHOD', 'AMOUNT'],
    countLabel: `Showing ${returns.length} records`,
    rows: returns.map(r => ({
      billNumber: r.return_number,
      date: new Date(r.created_at + ' UTC').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date(r.created_at + ' UTC').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: r.buyer_name || 'Walk-in',
      payment: methodLabel[r.refund_method] || r.refund_method || 'cash',
      amount: money(r.total_amount),
    })),
  }
}
