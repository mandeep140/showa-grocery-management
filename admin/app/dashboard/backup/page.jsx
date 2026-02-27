'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/util/api';

function FolderPickerModal({ isOpen, onClose, onSelect }) {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const browse = useCallback(async (dirPath) => {
    setLoading(true);
    setError('');
    try {
      const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
      const { data } = await api.get(`/api/backup/browse-dirs${params}`);
      if (data.success) {
        setCurrentPath(data.current);
        setParentPath(data.parent);
        setFolders(data.folders);
      } else {
        setError(data.message || 'Failed to browse');
      }
    } catch (err) {
      setError('Failed to browse directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) browse('');
  }, [isOpen, browse]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Select Backup Folder</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current path */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Current directory</p>
          <p className="text-sm font-mono text-gray-700 break-all">{currentPath || '...'}</p>
        </div>

        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Folder list */}
        <div className="max-h-85 overflow-y-auto px-2 py-2">
          {/* Go up */}
          {parentPath && (
            <button
              onClick={() => browse(parentPath)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-left transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">.. (Go up)</span>
            </button>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          ) : folders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No subfolders here</div>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => browse(folder.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">{folder.name}</span>
                <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSelect(currentPath); onClose(); }}
            disabled={!currentPath}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [backupFolder, setBackupFolder] = useState('');
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('backupFolder');
    if (saved) {
      setBackupFolder(saved);
    }
  }, []);

  useEffect(() => {
    if (backupFolder) {
      fetchBackups(backupFolder);
    } else {
      setBackups([]);
    }
  }, [backupFolder]);

  const fetchBackups = async (dir) => {
    try {
      const params = dir ? `?dir=${encodeURIComponent(dir)}` : '';
      const { data } = await api.get(`/api/backup${params}`);
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const handleSelectFolder = (folderPath) => {
    setBackupFolder(folderPath);
    localStorage.setItem('backupFolder', folderPath);
    setMessage({ type: 'success', text: `Backup folder set to: ${folderPath}` });
  };

  const handleCreateBackup = async () => {
    if (!backupFolder) {
      return setMessage({ type: 'error', text: 'Please select a backup folder first' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await api.post('/api/backup/create', { target_dir: backupFolder });
      if (data.success) {
        setMessage({ type: 'success', text: `Backup created: ${data.filename}` });
        await fetchBackups(backupFolder);
      } else {
        setMessage({ type: 'error', text: data.message || 'Backup failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromList = async (backupFile) => {
    if (!confirm(`Are you sure you want to restore from "${backupFile}"?\nThis will replace all current data. A safety backup will be created first.`)) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await api.post('/api/backup/restore', { backupFile, dir: backupFolder });
      if (data.success) {
        setMessage({ type: 'success', text: 'Database restored successfully! Please restart the server.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Restore failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during restore' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setMessage({ type: 'error', text: 'Please select a valid .zip backup file' });
      event.target.value = '';
      return;
    }

    if (!confirm(`Are you sure you want to restore from "${file.name}"?\nThis will replace all current data. A safety backup will be created first.`)) {
      event.target.value = '';
      return;
    }

    setRestoring(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('backup', file);

      const { data } = await api.post('/api/backup/restore-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (data.success) {
        setMessage({ type: 'success', text: 'Database restored successfully from file! Please restart the server.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Restore failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during restore' });
    } finally {
      setRestoring(false);
      event.target.value = '';
    }
  };

  const handleDownloadBackup = async (backupFile) => {
    try {
      const dirParam = backupFolder ? `?dir=${encodeURIComponent(backupFolder)}` : '';
      const response = await api.get(`/api/backup/download/${backupFile}${dirParam}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backupFile);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download backup' });
    }
  };

  const handleDeleteBackup = async (backupFile) => {
    if (!confirm(`Delete "${backupFile}"? This cannot be undone.`)) return;

    try {
      const dirParam = backupFolder ? `?dir=${encodeURIComponent(backupFolder)}` : '';
      const { data } = await api.delete(`/api/backup/${backupFile}${dirParam}`);
      if (data.success) {
        setMessage({ type: 'success', text: 'Backup deleted' });
        await fetchBackups(backupFolder);
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete backup' });
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Backup & Restore</h1>
        <p className="text-gray-600 mt-1">Manage your database backups</p>
      </div>

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="text-sm flex-1">{message.text}</p>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-current opacity-50 hover:opacity-100 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold flex items-center justify-center mr-3">1</span>
          Select Backup Folder
        </h2>
        <p className="text-sm text-gray-500 ml-10 mb-4">
          Choose a folder on the server where backups will be saved
        </p>

        <div className="ml-10 flex items-center gap-3">
          {backupFolder ? (
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-mono text-indigo-700 break-all flex-1">{backupFolder}</span>
              <button
                onClick={() => { setBackupFolder(''); localStorage.removeItem('backupFolder'); setBackups([]); }}
                className="p-1 text-indigo-400 hover:text-red-500 shrink-0"
                title="Clear folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex-1 px-4 py-3 rounded-lg bg-gray-50 border border-dashed border-gray-300 text-sm text-gray-400">
              No folder selected
            </div>
          )}
          <button
            onClick={() => setFolderPickerOpen(true)}
            className="px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {backupFolder ? 'Change Folder' : 'Browse...'}
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-xl shadow-md p-6 mb-6 transition ${!backupFolder ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold flex items-center justify-center mr-3">2</span>
          Create Backup
        </h2>
        <p className="text-sm text-gray-500 ml-10 mb-4">
          Creates a full <strong>.zip</strong> backup (database + images) in the selected folder
        </p>

        <div className="ml-10">
          <button
            onClick={handleCreateBackup}
            disabled={loading || !backupFolder}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center text-sm font-semibold"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Backup...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Backup Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Backups in selected folder ─────────────────────────────────── */}
      {backupFolder && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Backups in Folder
            </h2>
            <button
              onClick={() => fetchBackups(backupFolder)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-14 h-14 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">No backups in this folder yet</p>
              <p className="text-xs text-gray-400 mt-1">Click &quot;Create Backup Now&quot; to create one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{backup.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{backup.date ? formatDate(backup.date) : 'Unknown'}</span>
                          <span>{formatFileSize(backup.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownloadBackup(backup.name)}
                        disabled={loading}
                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-xs font-medium disabled:opacity-50"
                        title="Download"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleRestoreFromList(backup.name)}
                        disabled={loading}
                        className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition text-xs font-medium disabled:opacity-50"
                        title="Restore"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.name)}
                        disabled={loading}
                        className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition text-xs font-medium disabled:opacity-50"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Restore from File
        </h2>
        <p className="text-sm text-gray-500 ml-7 mb-4">
          Upload a <strong>.zip</strong> backup file directly to restore the database
        </p>

        <div className="ml-7">
          <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            restoring
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}>
            {restoring ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Restoring...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload &amp; Restore .zip
              </>
            )}
            <input
              type="file"
              accept=".zip"
              onChange={handleRestoreFromFile}
              className="hidden"
              disabled={restoring || loading}
            />
          </label>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Restoring a backup will replace all current data. A safety backup of the current database is automatically created before every restore. The server must be restarted after restoring.
            </p>
          </div>
        </div>
      </div>

      <FolderPickerModal
        isOpen={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        onSelect={handleSelectFolder}
      />
    </div>
  );
}
