'use client'
import React from 'react'
import { FaBox } from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";
import { IoAlert } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";
import { FaVanShuttle } from "react-icons/fa6";
import { IoWarningOutline } from "react-icons/io5";
import { FaRegClock } from "react-icons/fa6";
import { FaFileAlt } from "react-icons/fa";
import { IoAddOutline } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { BsFileEarmarkBarGraphFill } from "react-icons/bs";



const cards = [
  {
    name: 'Total Products', value: 1247, mainIcon: <FaBox />, sideIcon: <FaArrowTrendUp />, iconColor: '#009688'
  },
  {
    name: 'Low Stock Items', value: 56, mainIcon: <GoAlertFill />, sideIcon: <IoAlert />, iconColor: '#FF9800'
  },
  {
    name: "Today's Sales", value: 789, mainIcon: <FaRupeeSign />, sideIcon: <FaArrowTrendUp />, iconColor: '#4CAF50'
  },
  {
    name: 'Total Suppliers', value: 34, mainIcon: <FaVanShuttle />, sideIcon: <FaArrowTrendUp />, iconColor: '#3F51B5'
  }
]

const lowStockItems = [
  { name: 'Amul Milk 1L', stock: 5, id: 'SIM-123', lowLimit: 10 },
  { name: 'Britannia Bread', stock: 3, id: 'SIM-124', lowLimit: 15 },
  { name: 'Dabur Honey 500g', stock: 2, id: 'SIM-125', lowLimit: 8 },
  { name: 'Tata Salt 1kg', stock: 4, id: 'SIM-126', lowLimit: 20 },
  { name: 'Parle-G Biscuits', stock: 6, id: 'SIM-127', lowLimit: 12 }
]

const expiringItems = [
  { name: 'Amul Milk 1L', expiryDate: '2024-07-15', id: 'SIM-123' },
  { name: 'Dabur Honey 500g', expiryDate: '2024-08-01', id: 'SIM-125' },
  { name: 'Tata Salt 1kg', expiryDate: '2024-09-10', id: 'SIM-126' },
  { name: 'Parle-G Biscuits', expiryDate: '2024-07-30', id: 'SIM-127' },

]

const totalSales = [
  { timeStamp: Date.now() - 3600 * 1000, amount: 1500.00, id: 'INV-SIM-K23SGN' },
  { timeStamp: Date.now() - 7200 * 1000, amount: 2300.00, id: 'INV-SIM-K234GN' },
  { timeStamp: Date.now() - 10800 * 1000, amount: 1800.70, id: 'INV-SIM-K25SGN' },
  { timeStamp: Date.now() - 14400 * 1000, amount: 1200.40, id: 'INV-SIM-K236GN' },
  { timeStamp: Date.now() - 18000 * 1000, amount: 2000.00, id: 'INV-SIM-K237GN' }
]

const outOfStockItems = [
  { name: 'Nestle Maggi 2-Minute Noodles', id: 'SIM-128' },
  { name: 'Cadbury Dairy Milk Chocolate', id: 'SIM-129' },
  { name: 'Haldiram’s Aloo Bhujia', id: 'SIM-130' },
  { name: 'Tata Tea Gold', id: 'SIM-131' },
  { name: 'Surf Excel Detergent Powder', id: 'SIM-132' }
]

const quickActions = [
  { name: 'Add Product', icon: <IoAddOutline />, color: '#008C83' },
  { name: 'Open Billing (POS)', icon: <FaFileAlt />, color: '#4CAF50' },
  { name: 'New Purchase', icon: <FaShoppingCart />, color: '#2196F3' },
  { name: 'View Reports', icon: <BsFileEarmarkBarGraphFill />, color: '#FF9800' }
]

const recentlyAddedProducts = [
  { name: 'Amul Milk 1L', id: 'SIM-123', category: 'Dairy', timeAdded: Date.now() - 3600 * 1000, addedBy: 'Admin 1' },
  { name: 'Britannia Bread', id: 'SIM-124', category: 'Bakery', timeAdded: Date.now() - 7200 * 1000, addedBy: 'Admin 2' },
  { name: 'Dabur Honey 500g', id: 'SIM-125', category: 'Grocery', timeAdded: Date.now() - 10800 * 1000, addedBy: 'Admin 1' },
  { name: 'Tata Salt 1kg', id: 'SIM-126', category: 'Grocery', timeAdded: Date.now() - 14400 * 1000, addedBy: 'Admin 3' },
  { name: 'Parle-G Biscuits', id: 'SIM-127', category: 'Snacks', timeAdded: Date.now() - 18000 * 1000, addedBy: 'Admin 2' }
]

const recentlyUpdatedProducts = [
  { name: 'Tata Tea Gold', id: 'SIM-131', update: 'stock transfer', timeUpdated: Date.now() - 3600 * 1000, updatedBy: 'Admin 1' },
  { name: 'Surf Excel Detergent Powder', id: 'SIM-132', update: 'price change', timeUpdated: Date.now() - 7200 * 1000, updatedBy: 'Admin 2' },
  { name: 'Nestle Maggi 2-Minute Noodles', id: 'SIM-128', update: 'stock update', timeUpdated: Date.now() - 10800 * 1000, updatedBy: 'Admin 1' },
  { name: 'Cadbury Dairy Milk Chocolate', id: 'SIM-129', update: 'new batch added', timeUpdated: Date.now() - 14400 * 1000, updatedBy: 'Admin 3' },
  { name: 'Haldiram’s Aloo Bhujia', id: 'SIM-130', update: 'price change', timeUpdated: Date.now() - 18000 * 1000, updatedBy: 'Admin 2' }
]

const recentActivity = [
  { activity: 'Added new product', time: Date.now() - 3600 * 1000, by: 'Admin 1', category: 'inventory' },
  { activity: 'Updated stock for Tata Salt 1kg', time: Date.now() - 7200 * 1000, by: 'Admin 2', category: 'inventory' },
  { activity: 'Created new bill', time: Date.now() - 10800 * 1000, by: 'Admin 1', category: 'sales' },
  { activity: 'Added new supplier', time: Date.now() - 14400 * 1000, by: 'Admin 3', category: 'suppliers' },
  { activity: 'Updated price for Surf Excel Detergent Powder', time: Date.now() - 18000 * 1000, by: 'Admin 2', category: 'inventory' }
]

const Dashboard = () => {
  return (
    <div className='w-full min-h-screen bg-[#E6FFFD] px-4 py-20 sm:px-6 lg:px-10'>
      <h2 className='text-3xl font-semibold sm:text-4xl'>Dashboard</h2>
      {/* quick stat cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-10'>
        {cards.map((card) => (
          <div key={card.name} className='bg-white rounded-lg shadow p-5 flex flex-col items-start gap-5'>
            <span className='flex justify-around items-center w-full pr-4'>
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${card.iconColor}40` }}>
                <span className='text-white text-lg opacity-100' style={{ color: card.iconColor }}>{card.mainIcon}</span>
              </div>
              <div className='ml-auto'>
                <span className='text-2xl' style={{ color: card.iconColor }}>{card.sideIcon}</span>
              </div>
            </span>
            <div className='gap-6 flex flex-col'>
              <p className='text-sm text-gray-500'>{card.name}</p>
              <p className='text-3xl font-bold'>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* quick info table */}
      <div className='mb-10 flex w-full flex-col items-stretch gap-6 xl:flex-row xl:gap-7'>
        {/* low stock items */}
        <div className='w-full rounded-xl border-2 border-[#FFE0B2] bg-[#F4FAFF] xl:w-1/3'>
          <div className='w-full rounded-t-xl border-2 border-[#FFE0B2] flex items-center justify-around h-14  px-7 bg-[#FFE0B2]'>
            <p className='text-lg font-bold text-[#FFB74D]'><IoWarningOutline /></p>
            <p className='text-sm text-gray-500 ml-4'>Low Stock Items</p>
            <p className='text-sm text-white w-7 h-7 flex items-center ml-auto justify-center p-2 rounded-full bg-[#FFB74D] font-bold'>{lowStockItems.length}</p>
          </div>
          <div className='grid max-h-72 gap-2 overflow-y-auto px-4 py-6'>
            {lowStockItems.map((item) => (
              <div key={item.id} className='flex flex-col items-center justify-between py-2 bg-[#FFFBF5] border-2 border-[#FFE0B2] rounded-lg px-4'>
                <div className='flex justify-between w-full items-center'>
                  <p className='text-sm font-medium'>{item.name}</p>
                  <p className='text-xs text-gray-500'>ID: {item.id}</p>
                </div>
                <div className='flex justify-between items-center w-full mt-2'>
                  <p className='text-xs font-light text-black/70'>current stock</p>
                  <p className='text-sm text-[#FF9800]'>{item.stock} / {item.lowLimit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* expiring items */}
        <div className='w-full rounded-xl border-2 border-[#FFCDD2] bg-[#FFF5F5] xl:w-1/3'>
          <div className='w-full rounded-t-xl border-2 border-[#FFCDD2] flex items-center justify-around h-14 px-7 bg-[#FFCDD2]'>
            <p className='text-lg font-bold text-[#EF5350]'><FaRegClock /></p>
            <p className='text-sm text-gray-500 ml-4'>Expiring Soon</p>
            <p className='text-sm text-white w-7 h-7 flex items-center ml-auto justify-center p-2 rounded-full bg-[#EF5350] font-bold'>{expiringItems.length}</p>
          </div>
          <div className='grid max-h-72 gap-2 overflow-y-auto px-4 py-6'>
            {expiringItems.map((item) => (
              <div key={item.id} className='flex flex-col items-center justify-between py-2 bg-[#FFF5F5] border-2 border-[#FFCDD2] rounded-lg px-4'>
                <div className='flex justify-between w-full items-center'>
                  <p className='text-sm font-medium'>{item.name}</p>
                  <p className='text-xs text-gray-500'>ID: {item.id}</p>
                </div>
                <div className='flex justify-between items-center w-full mt-2'>
                  <p className='text-xs font-light text-black/70'>expiry date</p>
                  <p className='text-sm text-[#EF5350]'>{new Date(item.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* out of stock items */}
        <div className='w-full rounded-xl border-2 border-[#FFCDD2] bg-[#FFF5F5] xl:w-1/3'>
          <div className='w-full rounded-t-xl border-2 border-[#FFCDD2] flex items-center justify-around h-14 px-7 bg-[#FFCDD2]'>
            <p className='text-lg font-bold text-[#EF5350]'><FaBox /></p>
            <p className='text-sm text-gray-500 ml-4'>Out of Stock</p>
            <p className='text-sm text-white w-7 h-7 flex items-center ml-auto justify-center p-2 rounded-full bg-[#EF5350] font-bold'>{outOfStockItems.length}</p>
          </div>
          <div className='grid max-h-72 gap-2 overflow-y-auto px-4 py-6'>
            {outOfStockItems.map((item) => (
              <div key={item.id} className='flex flex-col items-center justify-between py-2 bg-[#FFF5F5] border-2 border-[#FFCDD2] rounded-lg px-4'>
                <div className='flex justify-between w-full items-center'>
                  <p className='text-sm font-medium'>{item.name}</p>
                  <p className='text-xs text-gray-500'>ID: {item.id}</p>
                </div>
                <div className='flex justify-between items-center w-full mt-2'>
                  <p className='text-xs font-light text-black/70'>status</p>
                  <p className='text-sm text-[#EF5350]'>Out of Stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* today sales and quick actions */}
      <div className='flex w-full flex-col items-stretch gap-6 xl:flex-row xl:gap-7'>
        {/* today sales */}
        <div className='w-full rounded-xl border border-[#C8E6C9] bg-white xl:w-7/10'>
          <div className='w-full rounded-t-xl flex items-center justify-start h-14 px-6 bg-[#E8F5E9] gap-4'>
            <p className='text-lg font-bold text-[#4CAF50]'><FaRupeeSign /></p>
            <p className='text-lg font-bold'>Today&apos;s Sales Overview</p>
          </div>
          <div className='flex w-full flex-col gap-4 bg-[#F9F9F9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-10'>
            <span>
              <p className='font-light text-sm'>Total Bills</p>
              <p className='font-bold text-2xl'>{totalSales.length}</p>
            </span>
            <span>
              <p className='font-light text-sm'>Total Amount</p>
              <p className='font-bold text-2xl text-green-600 flex items-center'><FaRupeeSign />{totalSales.reduce((acc, sale) => acc + sale.amount, 0)}</p>
            </span>
          </div>
          <div className='mt-2 px-3'>
            <p className='my-4'>Recent Sales</p>
            <div className='grid max-h-72 w-full gap-4 overflow-y-auto sm:gap-6'>
              {totalSales.map((sale) => (
                <div key={sale.id} className='flex items-center gap-3 rounded-lg px-2 sm:px-4'>
                  <div className='p-3 text-xl rounded-lg bg-[#E8F5E9] text-[#4CAF50]'><FaFileAlt /></div>
                  <div className='w-full items-center'>
                    <p className='text-sm font-medium text-green-600'>{sale.id}</p>
                    <p className='text-xs text-gray-500'>{new Date(sale.timeStamp).toLocaleTimeString()}</p>
                  </div>
                  <div className='flex justify-between items-center mt-2 ml-auto'>
                    <p className='text-sm flex items-center'><FaRupeeSign />{sale.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* quick actions */}
        <div className='w-full rounded-xl border border-[#BBDEFB] bg-white xl:w-3/10'>
          <div className='w-full rounded-t-xl flex items-center justify-start h-14 px-6 bg-[#F5F5F5] gap-4'>
            <p className='text-lg font-bold text-green-600'><FaBox /></p>
            <p className='text-md font-semibold'>Quick Actions</p>
          </div>
          <div className='grid max-h-80 w-full gap-4 overflow-y-auto p-4 sm:gap-6'>
            {quickActions.map((action) => (
              <div key={action.name} className='flex items-center rounded-lg px-4 gap-3 cursor-pointer' style={{ backgroundColor: `${action.color}20` }}>
                <div className='p-2 text-xl rounded-lg' style={{ backgroundColor: action.color, color: 'white' }}>{action.icon}</div>
                <div className='w-full items-center'>
                  <p className='text-sm font-medium' style={{ color: action.color }}>{action.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* snapshot and activity */}
      <div className='my-10 flex w-full flex-col items-stretch gap-6 2xl:flex-row 2xl:gap-7'>
        {/* snapshot */}
        <div className='w-full rounded-xl border border-[#C8E6C9] bg-white 2xl:w-1/2'>
          <div className='w-full rounded-t-xl flex items-center justify-start h-14 px-6 bg-[#E8F5E9] gap-4'>
            <p className='text-lg font-bold text-[#4CAF50]'><FaBox /></p>
            <p className='text-lg font-bold'>Inventory Snapshot</p>
          </div>
          <div className='grid max-h-[40rem] w-full gap-6 overflow-y-auto p-4'>
            <p>Recently Added Products</p>
            {recentlyAddedProducts.map((product) => (
              <div key={product.id} className='flex items-center rounded-lg px-4 gap-3'>
                <div className='w-full items-center'>
                  <p className='text-sm font-semibold'>{product.name}</p>
                  <p className='text-xs text-gray-500'>{product.id} • {product.category}</p>
                </div>
                <div className='ml-auto mt-2 shrink-0 text-right sm:w-20'>
                  <p className='text-green-500 text-sm'>{product.addedBy}</p>
                  <p className='text-xs text-gray-500'>{new Date(product.timeAdded).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}

            <hr />

            <p>Recently Updated Products</p>
            {recentlyUpdatedProducts.map((product) => (
              <div key={product.id} className='flex items-center rounded-lg px-4 gap-3'>
                <div className='w-full items-center'>
                  <p className='text-sm font-semibold'>{product.name}</p>
                  <p className='text-xs text-gray-500'>{product.id} • {product.update}</p>
                </div>
                <div className='ml-auto mt-2 shrink-0 text-right sm:w-20'>
                  <p className='text-green-500 text-sm'>{product.updatedBy}</p>
                  <p className='text-xs text-gray-500'>{new Date(product.timeUpdated).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* recent activity */}
        <div className='w-full rounded-xl border border-[#BBDEFB] bg-white 2xl:w-1/2'>
          <div className='w-full rounded-t-xl flex items-center justify-start h-14 px-6 bg-[#F5F5F5] gap-4'>
            <p className='text-lg font-bold text-[#2196F3]'><FaBox /></p>
            <p className='text-lg font-bold'>Recent Activity</p>
          </div>
          <div className='grid max-h-[40rem] w-full gap-6 overflow-y-auto p-4'>
            {recentActivity.map((activity, index) => (
              <div key={index} className='flex items-center gap-3 rounded-lg px-2 sm:px-4'>
                <span>{
                  activity.category === 'inventory' ? <FaBox /> :
                    activity.category === 'sales' ? <FaRupeeSign /> :
                      activity.category === 'suppliers' ? <FaVanShuttle /> :
                        <FaBox />
}</span>
                <div className='w-full items-center'>
                  <p className='text-sm font-semibold'>{activity.activity}</p>
                  <p className='text-xs text-gray-500'>{activity.by} • {activity.category}</p>
                </div>
                <div className='ml-auto mt-2 shrink-0 text-right sm:w-20'>
                  <p className='text-gray-500 text-xs'>{new Date(activity.time).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
