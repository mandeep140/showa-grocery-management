import { InventoryReportIcon, LossReportIcon, PurchaseReportIcon, SalesReportIcon } from './report-icons'

const money = (value) => `\u20B9${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const tabs = [
  { id: 'sales', label: 'Sales Report', icon: SalesReportIcon },
  { id: 'inventory', label: 'Inventory Report', icon: InventoryReportIcon },
  { id: 'purchase', label: 'Purchase Report', icon: PurchaseReportIcon },
  { id: 'loss', label: 'Loss Report', icon: LossReportIcon },
]

export const pillStyles = {
  Cash: 'bg-[#EAF8EE] text-[#29985a]',
  UPI: 'bg-[#E9F3FE] text-[#5F9DDA]',
  Card: 'bg-[#FFF2DF] text-[#DAA04D]',
  'In Stock': 'bg-[#EAF8EE] text-[#29985a]',
  'Low Stock': 'bg-[#FFF2DF] text-[#DAA04D]',
  'Out of Stock': 'bg-[#FFE8E8] text-[#DA6A6A]',
  Paid: 'bg-[#EAF8EE] text-[#29985a]',
  Pending: 'bg-[#FFF2DF] text-[#DAA04D]',
}

const REPORT_CONTENT = {
  sales: {
    type: 'sales',
    title: 'Sales Report Data',
    cards: [
      { label: 'Total Records', value: '7', className: 'text-[#2b3b3f]' },
      { label: 'Total Amount', value: money(2892.5), className: 'text-[#14a388]' },
      { label: 'Total Items', value: '23', className: 'text-[#22a061]' },
    ],
    headers: ['BILL NUMBER', 'DATE & TIME', 'ITEMS COUNT', 'PAYMENT MODE', 'TOTAL AMOUNT'],
    countLabel: 'Showing 7 records',
    rows: [
      { billNumber: 'INV-1738496522000', date: '02 Feb 2026', time: '02:35:22 pm', items: 3, payment: 'Cash', amount: money(327) },
      { billNumber: 'INV-1738497933000', date: '02 Feb 2026', time: '12:45:33 pm', items: 1, payment: 'UPI', amount: money(180) },
      { billNumber: 'INV-1738497120000', date: '02 Feb 2026', time: '11:32:00 am', items: 5, payment: 'Card', amount: money(450.5) },
      { billNumber: 'INV-1738496500000', date: '02 Feb 2026', time: '10:15:00 am', items: 2, payment: 'Cash', amount: money(275) },
      { billNumber: 'INV-1738495800000', date: '02 Feb 2026', time: '09:30:00 am', items: 4, payment: 'UPI', amount: money(620) },
      { billNumber: 'INV-1738494900000', date: '01 Feb 2026', time: '06:45:12 pm', items: 2, payment: 'Cash', amount: money(150) },
      { billNumber: 'INV-1738494200000', date: '01 Feb 2026', time: '05:20:45 pm', items: 6, payment: 'Card', amount: money(890) },
    ],
  },
  inventory: {
    type: 'inventory',
    title: 'Inventory Report Data',
    cards: [
      { label: 'Total Records', value: '8', className: 'text-[#2b3b3f]' },
      { label: 'Total Stock', value: '327', className: 'text-[#22a061]' },
    ],
    headers: ['PRODUCT NAME', 'CATEGORY', 'AVAILABLE STOCK', 'MINIMUM STOCK', 'STATUS'],
    countLabel: 'Showing 8 records',
    rows: [
      { product: 'Tata Salt 1kg', category: 'Grocery', availableStock: 165, minimumStock: 20, status: 'In Stock' },
      { product: 'Amul Butter 500g', category: 'Dairy', availableStock: 8, minimumStock: 10, status: 'Low Stock' },
      { product: 'Basmati Rice Premium', category: 'Grocery', availableStock: 0, minimumStock: 50, status: 'Out of Stock' },
      { product: 'Fortune Oil 1L', category: 'Cooking Oil', availableStock: 120, minimumStock: 15, status: 'In Stock' },
      { product: 'Maggi Noodles', category: 'Instant Food', availableStock: 17, minimumStock: 30, status: 'Low Stock' },
      { product: 'Dove Soap 100g', category: 'Personal Care', availableStock: 5, minimumStock: 15, status: 'Low Stock' },
      { product: 'Colgate Toothpaste', category: 'Personal Care', availableStock: 12, minimumStock: 20, status: 'Low Stock' },
      { product: 'Coca Cola 2L', category: 'Beverages', availableStock: 0, minimumStock: 25, status: 'Out of Stock' },
    ],
  },
  purchase: {
    type: 'purchase',
    title: 'Purchase Report Data',
    cards: [
      { label: 'Total Records', value: '6', className: 'text-[#2b3b3f]' },
      { label: 'Total Purchase', value: money(12730), className: 'text-[#22a061]' },
      { label: 'Total Items', value: '94', className: 'text-[#22a061]' },
    ],
    headers: ['INVOICE', 'SUPPLIER', 'DATE', 'ITEMS', 'STATUS', 'TOTAL AMOUNT'],
    countLabel: 'Showing 6 records',
    rows: [
      { invoice: 'PUR-2026-1001', supplier: 'FreshMart Distributors', date: '02 Feb 2026', items: 24, status: 'Paid', amount: money(3250) },
      { invoice: 'PUR-2026-1002', supplier: 'DairyHouse Pvt Ltd', date: '02 Feb 2026', items: 14, status: 'Pending', amount: money(1980) },
      { invoice: 'PUR-2026-1003', supplier: 'Daily Grocery Hub', date: '01 Feb 2026', items: 18, status: 'Paid', amount: money(2640) },
      { invoice: 'PUR-2026-1004', supplier: 'Foodline Supplies', date: '01 Feb 2026', items: 12, status: 'Paid', amount: money(1430) },
      { invoice: 'PUR-2026-1005', supplier: 'Kitchen Essentials', date: '31 Jan 2026', items: 10, status: 'Pending', amount: money(1080) },
      { invoice: 'PUR-2026-1006', supplier: 'Metro Wholesale', date: '31 Jan 2026', items: 16, status: 'Paid', amount: money(2350) },
    ],
  },
  loss: {
    type: 'loss',
    title: 'Loss Report Data',
    cards: [
      { label: 'Total Records', value: '5', className: 'text-[#2b3b3f]' },
      { label: 'Total Loss', value: money(975), className: 'text-[#ef5c55]' },
      { label: 'Lost Units', value: '18', className: 'text-[#ef5c55]' },
    ],
    headers: ['PRODUCT', 'CATEGORY', 'QUANTITY', 'REASON', 'LOSS AMOUNT'],
    countLabel: 'Showing 5 records',
    rows: [
      { product: 'Amul Milk 1L', category: 'Dairy', quantity: 6, reason: 'Expired', amount: money(360) },
      { product: 'Tomato 1kg', category: 'Vegetables', quantity: 4, reason: 'Damaged', amount: money(180) },
      { product: 'Bread Loaf', category: 'Bakery', quantity: 3, reason: 'Expired', amount: money(135) },
      { product: 'Cold Drink 500ml', category: 'Beverages', quantity: 2, reason: 'Leaked', amount: money(90) },
      { product: 'Curd Cup', category: 'Dairy', quantity: 3, reason: 'Spoiled', amount: money(210) },
    ],
  },
}

export const getReportContent = (activeTab) => REPORT_CONTENT[activeTab] ?? REPORT_CONTENT.sales
