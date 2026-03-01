'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/util/api';

function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
      toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {toast.type === 'success'
        ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      }
      <span>{toast.message}</span>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, summary, dateRange, loading }) {
  if (!isOpen) return null;
  const from = dateRange.from || 'All time';
  const to   = dateRange.to   || 'All time';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 bg-red-50 border-b border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-red-700">Confirm Delete + Backup</h3>
            <p className="text-xs text-red-400 mt-0.5">{from} → {to}</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {summary && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Orders',   value: Number(summary.total_orders).toLocaleString() },
                { label: 'Amount',   value: `₹${Number(summary.total_sales_amount || 0).toLocaleString()}` },
                { label: 'Debts',    value: Number(summary.total_debts).toLocaleString() },
                { label: 'Returns',  value: Number(summary.total_returns).toLocaleString() },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">A JSON backup will be auto-saved before deleting.</p>
            <p>You can restore the data later from the Backups section on this page.</p>
            <p className="mt-1">Orders, debts, returns, and stock history entries will be removed. <strong>Inventory/batches are NOT touched.</strong></p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? 'Saving backup & deleting...' : 'Backup & Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Restore confirmation modal ────────────────────────────────────────────
function RestoreModal({ isOpen, onClose, onConfirm, backup, loading }) {
  if (!isOpen || !backup) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 bg-green-50 border-b border-green-100">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-green-700">Restore Sales Data</h3>
            <p className="text-xs text-green-500 mt-0.5">From: {backup.filename}</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {backup.meta && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Orders',    value: backup.meta.total_orders },
                { label: 'Debts',     value: backup.meta.total_debts },
                { label: 'From date', value: backup.meta.start_date || 'All' },
                { label: 'To date',   value: backup.meta.end_date   || 'All' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            Records with duplicate IDs will be skipped (INSERT OR IGNORE). Existing data is not overwritten.
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataManagementPage() {
  const [toast, setToast]                   = useState(null);
  const [exportLoading, setExportLoading]   = useState({});

  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [summary, setSummary]               = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showDelete, setShowDelete]         = useState(false);
  const [deleteLoading, setDeleteLoading]   = useState(false);

  const [backups, setBackups]               = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [restoreTarget, setRestoreTarget]   = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('start_date', dateFrom);
      if (dateTo)   params.set('end_date', dateTo);
      const { data } = await api.get(`/api/data/sales-summary?${params}`);
      if (data.success) setSummary(data.summary);
    } catch { /* silent */ } finally {
      setSummaryLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchBackups = useCallback(async () => {
    setBackupsLoading(true);
    try {
      const { data } = await api.get('/api/data/sales-backups');
      if (data.success) setBackups(data.backups);
    } catch { /* silent */ } finally {
      setBackupsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleExport = async (type) => {
    setExportLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await api.get(`/api/data/export/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully.`);
    } catch { showToast(`Failed to export ${type}.`, 'error'); }
    finally  { setExportLoading(prev => ({ ...prev, [type]: false })); }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const { data } = await api.post('/api/data/delete-sales', {
        start_date: dateFrom || undefined,
        end_date:   dateTo   || undefined
      });
      if (data.success) {
        showToast(data.message);
        setShowDelete(false);
        fetchSummary();
        fetchBackups();
      } else {
        showToast(data.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Server error.', 'error');
    } finally { setDeleteLoading(false); }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const res = await api.get(`/api/data/download-sales-backup/${encodeURIComponent(filename)}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { showToast('Failed to download backup.', 'error'); }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      const { data } = await api.post('/api/data/restore-sales', { filename: restoreTarget.filename });
      if (data.success) {
        showToast(data.message);
        setRestoreTarget(null);
        fetchSummary();
      } else {
        showToast(data.message || 'Restore failed.', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Server error.', 'error');
    } finally { setRestoreLoading(false); }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Delete backup "${filename}"?`)) return;
    setDeletingBackup(filename);
    try {
      const { data } = await api.delete(`/api/data/sales-backup/${encodeURIComponent(filename)}`);
      if (data.success) { showToast('Backup deleted.'); fetchBackups(); }
      else showToast(data.message || 'Failed.', 'error');
    } catch { showToast('Failed to delete backup.', 'error'); }
    finally  { setDeletingBackup(null); }
  };

  const exportOptions = [
    { key: 'inventory', label: 'Inventory', desc: 'Products, batches, quantities, rates', color: 'blue',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg> },
    { key: 'sales', label: 'Sales', desc: 'Orders, amounts, payment status', color: 'green',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { key: 'purchases', label: 'Purchases', desc: 'Suppliers, invoices, amounts', color: 'purple',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    { key: 'customers', label: 'Customers', desc: 'Contacts, balances, order totals', color: 'orange',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];
  const cMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500',  btn: 'bg-green-600 hover:bg-green-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500', btn: 'bg-orange-600 hover:bg-orange-700' },
  };

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <Toast toast={toast} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-sm text-gray-500 mt-1">Export data as CSV, delete old sales by date range (auto-backup JSON), and restore from backups.</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <h2 className="text-base font-semibold text-gray-700">Export Data (CSV)</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {exportOptions.map(opt => {
            const c = cMap[opt.color];
            const isLoading = exportLoading[opt.key];
            return (
              <Card key={opt.key} className="overflow-hidden">
                <div className={`${c.bg} px-4 py-3 flex items-center gap-2`}>
                  <span className={c.icon}>{opt.icon}</span>
                  <h3 className={`font-bold text-sm ${c.text}`}>{opt.label}</h3>
                </div>
                <div className="px-4 py-4 flex flex-col gap-3">
                  <p className="text-xs text-gray-400 leading-relaxed">{opt.desc}</p>
                  <button
                    onClick={() => handleExport(opt.key)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 ${c.btn} text-white text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50`}
                  >
                    {isLoading ? <><Spinner size={3.5} />Exporting...</> : <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export CSV
                    </>}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h2 className="text-base font-semibold text-red-600">Delete Sales Data</h2>
        </div>

        <Card>
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-500">
              Select a date range to delete old billing records. A JSON backup is automatically created before deletion. Inventory and batch quantities are <strong className="text-gray-700">not affected</strong>.
            </p>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                onClick={fetchSummary}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center min-h-8">
              {summaryLoading ? (
                <span className="flex items-center gap-2 text-xs text-gray-400"><Spinner size={3.5} />Loading summary...</span>
              ) : summary ? (
                <>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">{Number(summary.total_orders).toLocaleString()} orders</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">₹{Number(summary.total_sales_amount || 0).toLocaleString()} total</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">₹{Number(summary.total_received || 0).toLocaleString()} received</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">{Number(summary.total_debts).toLocaleString()} debts</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">{Number(summary.total_returns).toLocaleString()} returns</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No data</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <strong>Note:</strong> A JSON backup is auto-saved on the server before deletion. You can restore it below.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                disabled={!summary || summary.total_orders === 0}
                className="ml-4 shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Backup & Delete
              </button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h2 className="text-base font-semibold text-gray-700">Sales Backups</h2>
            {backups.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{backups.length}</span>
            )}
          </div>
          <button onClick={fetchBackups} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        <Card>
          {backupsLoading ? (
            <div className="flex items-center gap-3 p-6 text-gray-400 text-sm">
              <Spinner /> Loading backups...
            </div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No sales backups yet. Backups are created automatically when you delete sales data.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {backups.map(backup => {
                const meta = backup.meta;
                const createdAt = new Date(backup.file_created_at).toLocaleString();
                const isDeleting = deletingBackup === backup.filename;
                return (
                  <div key={backup.filename} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 gap-3 hover:bg-gray-50/60 transition">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{backup.filename}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>Created: {createdAt}</span>
                        <span>Size: {fmtSize(backup.size)}</span>
                        {meta && (
                          <>
                            <span className="text-gray-600 font-medium">{meta.total_orders} orders</span>
                            {meta.start_date && <span>From {meta.start_date}</span>}
                            {meta.end_date   && <span>To {meta.end_date}</span>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownloadBackup(backup.filename)}
                        title="Download JSON"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>

                      <button
                        onClick={() => setRestoreTarget(backup)}
                        title="Restore"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Restore
                      </button>

                      <button
                        onClick={() => handleDeleteBackup(backup.filename)}
                        disabled={isDeleting}
                        title="Delete backup"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {isDeleting ? <Spinner size={4} /> : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <DeleteModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
        summary={summary}
        dateRange={{ from: dateFrom, to: dateTo }}
        loading={deleteLoading}
      />
      <RestoreModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestoreConfirm}
        backup={restoreTarget}
        loading={restoreLoading}
      />
    </div>
  );
}