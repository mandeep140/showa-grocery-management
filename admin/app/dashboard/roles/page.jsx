'use client';

import React, { useState, useEffect } from 'react';
import api from '@/util/api';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [error, setError] = useState('');

  const availablePermissions = [
    { id: 'inventory_view', label: 'View Products & Stock', category: 'Inventory' },
    { id: 'inventory_create', label: 'Add Products', category: 'Inventory' },
    { id: 'inventory_edit', label: 'Edit Products / Transfer', category: 'Inventory' },
    { id: 'inventory_delete', label: 'Delete / Dispose Products', category: 'Inventory' },
    { id: 'supplier_view', label: 'View Suppliers', category: 'Supplier' },
    { id: 'supplier_create', label: 'Add Suppliers', category: 'Supplier' },
    { id: 'supplier_edit', label: 'Edit / Pay Suppliers', category: 'Supplier' },
    { id: 'supplier_delete', label: 'Delete Suppliers', category: 'Supplier' },
    { id: 'purchase_view', label: 'View Purchases', category: 'Purchase' },
    { id: 'purchase_create', label: 'Add / Edit Purchases', category: 'Purchase' },
    { id: 'purchase_delete', label: 'Delete Purchases', category: 'Purchase' },
    { id: 'billing', label: 'Billing / POS', category: 'Billing' },
    { id: 'invoice', label: 'Invoice Lookup', category: 'Invoice' },
    { id: 'debts', label: 'Debts Management', category: 'Debts' },
    { id: 'reports', label: 'Reports', category: 'Reports' },
    { id: 'customers', label: 'Customers Management', category: 'Customers' },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/api/roles');
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      let perms = [];
      if (role.permissions) {
        if (role.permissions === 'all') {
          perms = availablePermissions.map(p => p.id);
        } else {
          // Parse comma-separated string
          perms = role.permissions.split(',').map(p => p.trim()).filter(p => p);
        }
      }
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: perms
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setError('');
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Convert permissions array to "all" or comma-separated string
      let permissionsString;
      if (formData.permissions.length === availablePermissions.length) {
        permissionsString = 'all';
      } else {
        permissionsString = formData.permissions.join(', ');
      }

      const dataToSend = {
        ...formData,
        permissions: permissionsString
      };

      let response;
      if (editingRole) {
        response = await api.put(`/api/roles/${editingRole.id}`, dataToSend);
      } else {
        response = await api.post('/api/roles', dataToSend);
      }

      if (response.data.success) {
        await fetchRoles();
        handleCloseModal();
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDelete = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      const { data } = await api.delete(`/api/roles/${roleId}`);
      if (data.success) {
        await fetchRoles();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  // Group permissions by category
  const permissionsByCategory = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Roles Management</h1>
          <p className="text-gray-600 mt-1">Define roles and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          let permissions = [];
          if (role.permissions) {
            if (role.permissions === 'all') {
              permissions = availablePermissions.map(p => p.id);
            } else {
              // Parse comma-separated string
              permissions = role.permissions.split(',').map(p => p.trim()).filter(p => p);
            }
          }
          return (
            <div key={role.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description || 'No description'}</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                  {permissions.length} perms
                </span>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenModal(role)}
                    className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                  >
                    Edit
                  </button>
                  {role.name.toLowerCase() !== 'admin' && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {roles.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No roles found. Create one to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRole ? 'Edit Role' : 'Add Role'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={editingRole?.name?.toLowerCase() === 'admin'}
                  required
                />
                {editingRole?.name?.toLowerCase() === 'admin' && (
                  <p className="text-xs text-gray-500 mt-1">Admin role name cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  rows="3"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.permissions.length === availablePermissions.length) {
                        setFormData(prev => ({ ...prev, permissions: [] }));
                      } else {
                        setFormData(prev => ({ ...prev, permissions: availablePermissions.map(p => p.id) }));
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {formData.permissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                        {perms.map((perm) => (
                          <label key={perm.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.id)}
                              onChange={() => handlePermissionToggle(perm.id)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.permissions.length} permissions
                </p>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
