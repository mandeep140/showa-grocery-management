'use client';

import React, { useState } from 'react';
import api from '@/util/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setSummary(null);

    try {
      let response;
      const params = {
        start_date: dateRange.startDate || undefined,
        end_date: dateRange.endDate || undefined,
      };

      switch (activeTab) {
        case 'sales':
          response = await api.get('/api/reports/sales', { params });
          if (response.data.success) {
            setReportData(response.data.orders || []);
            setSummary(response.data.summary || null);
          }
          break;
        case 'users':
          response = await api.get('/api/reports/users', { params });
          if (response.data.success) {
            setReportData(response.data.users || []);
          }
          break;
        case 'inventory':
          response = await api.get('/api/reports/inventory');
          if (response.data.success) {
            setReportData(response.data.products || []);
            setSummary(response.data.summary || null);
          }
          break;
        default:
          break;
      }

      if (response && !response.data.success) {
        alert(response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', name: 'Sales Report', icon: '💰' },
    { id: 'users', name: 'User Activity', icon: '👥' },
    { id: 'inventory', name: 'Inventory Report', icon: '📦' },
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const stockStatusColor = (status) => {
    if (status === 'in_stock') return 'bg-green-100 text-green-800';
    if (status === 'low_stock') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const stockStatusLabel = (status) => {
    if (status === 'in_stock') return 'In Stock';
    if (status === 'low_stock') return 'Low Stock';
    return 'Out of Stock';
  };

  const exportToCSV = () => {
    if (!reportData) return;
    let csv = '';
    let filename = '';

    switch (activeTab) {
      case 'sales':
        filename = 'sales_report.csv';
        csv = 'Order ID,Date,Customer,Final Amount,Received,Payment Status,Created By\n';
        reportData.forEach((item) => {
          csv += `${item.id},"${formatDate(item.created_at)}","${item.buyer_name || 'Walk-in'}",${item.final_amount},${item.received_amount},"${item.payment_status}","${item.created_by_name || ''}"\n`;
        });
        break;
      case 'users':
        filename = 'user_activity_report.csv';
        csv = 'Name,Username,Role,Active,Total Orders,Total Sales,Purchases\n';
        reportData.forEach((item) => {
          csv += `"${item.name}","${item.username}","${item.role_name}","${item.is_active ? 'Yes' : 'No'}",${item.total_orders || 0},${item.total_sales || 0},${item.total_purchases || 0}\n`;
        });
        break;
      case 'inventory':
        filename = 'inventory_report.csv';
        csv = 'Product,Code,Category,Brand,Stock,Selling Price,Stock Value,Status\n';
        reportData.forEach((item) => {
          csv += `"${item.name}","${item.product_code}","${item.category_name}","${item.brand_name}",${item.total_stock},${item.default_selling_price},${item.stock_value},"${item.stock_status}"\n`;
        });
        break;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and view business reports</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setReportData(null); setSummary(null); }}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Section */}
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            {activeTab !== 'inventory' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Generate Report
                  </>
                )}
              </button>
              {reportData && reportData.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {activeTab === 'sales' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total_orders}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Net Sales</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_sales)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Received</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.total_received)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Profit</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(summary.total_profit)}</p>
              </div>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Products</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total_products}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">In Stock</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.in_stock}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.low_stock}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.out_of_stock}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Data */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {!reportData ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No report generated yet</p>
            <p className="text-sm mt-1">Click "Generate Report" to view data</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No data found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'sales' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.buyer_name || 'Walk-in'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(item.final_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.received_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.created_by_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_orders || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(item.total_sales)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_purchases || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'inventory' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_stock} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.default_selling_price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(item.stock_value)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatusColor(item.stock_status)}`}>
                          {stockStatusLabel(item.stock_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
