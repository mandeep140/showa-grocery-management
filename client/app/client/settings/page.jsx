'use client'
import React, { useState, useEffect } from 'react'
import { IoMdAdd } from "react-icons/io"
import { GoPencil } from "react-icons/go"
import { FiTrash2 } from "react-icons/fi"
import { IoClose } from "react-icons/io5"
import { FiCheck } from "react-icons/fi"
import { BiCategory } from "react-icons/bi"
import { TbBrandAirtable } from "react-icons/tb"
import { HiOutlineLocationMarker } from "react-icons/hi"
import api from '@/util/api'

const Settings = () => {
    const [activeTab, setActiveTab] = useState('categories')
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({})

    const tabs = [
        { id: 'categories', label: 'Categories', icon: <BiCategory /> },
        { id: 'brands', label: 'Brands', icon: <TbBrandAirtable /> },
        { id: 'locations', label: 'Locations', icon: <HiOutlineLocationMarker /> },
    ]

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [catRes, brandRes, locRes] = await Promise.all([
                api.get('/api/categories'),
                api.get('/api/brands'),
                api.get('/api/locations'),
            ])
            if (catRes.data.success) setCategories(catRes.data.categories)
            if (brandRes.data.success) setBrands(brandRes.data.brands)
            if (locRes.data.success) setLocations(locRes.data.locations)
        } catch (err) {
            console.error('Failed to fetch settings data:', err)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingId(null)
        setFormData({})
    }

    const openAddForm = () => {
        setEditingId(null)
        if (activeTab === 'locations') {
            setFormData({ name: '', location_type: 'shop', address: '' })
        } else {
            setFormData({ name: '', description: '' })
        }
        setShowForm(true)
    }

    const openEditForm = (item) => {
        setEditingId(item.id)
        if (activeTab === 'locations') {
            setFormData({ name: item.name, location_type: item.location_type || 'shop', address: item.address || '' })
        } else {
            setFormData({ name: item.name, description: item.description || '' })
        }
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!formData.name?.trim()) return alert('Name is required')
        const endpoint = `/api/${activeTab}`
        try {
            let res
            if (editingId) {
                res = await api.put(`${endpoint}/${editingId}`, formData)
            } else {
                res = await api.post(endpoint, formData)
            }
            if (res.data.success) {
                resetForm()
                fetchAll()
            } else {
                alert(res.data.message || 'Operation failed')
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong')
        }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This cannot be undone if it has no linked items.`)) return
        try {
            const res = await api.delete(`/api/${activeTab}/${id}`)
            if (res.data.success) {
                fetchAll()
            } else {
                alert(res.data.message || 'Cannot delete')
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete')
        }
    }

    const getCurrentData = () => {
        if (activeTab === 'categories') return categories
        if (activeTab === 'brands') return brands
        if (activeTab === 'locations') return locations
        return []
    }

    const handleTabChange = (tabId) => {
        setActiveTab(tabId)
        resetForm()
    }

    return (
        <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
            <div className='w-full flex items-center justify-between mb-10'>
                <h2 className='font-semibold text-4xl'>Settings</h2>
            </div>

            <div className='flex gap-3 mb-6'>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-[#008C83] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        <span className='text-lg'>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className='bg-white rounded-xl p-8'>
                <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold capitalize'>{activeTab}</h3>
                    <button
                        onClick={openAddForm}
                        className='bg-[#008C83] hover:bg-[#00675B] text-white px-5 py-2 rounded-lg duration-200 cursor-pointer flex items-center gap-2'
                    >
                        <IoMdAdd /> Add {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Location'}
                    </button>
                </div>

                {showForm && (
                    <div className='bg-[#F0FFFE] border border-[#008C83]/20 rounded-xl p-6 mb-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h4 className='font-semibold text-lg'>
                                {editingId ? 'Edit' : 'Add'} {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Location'}
                            </h4>
                            <button onClick={resetForm} className='text-gray-400 hover:text-gray-600 cursor-pointer'>
                                <IoClose className='text-xl' />
                            </button>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-600 mb-1'>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder='Enter name'
                                    className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                />
                            </div>
                            {activeTab === 'locations' ? (
                                <>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-600 mb-1'>Type *</label>
                                        <select
                                            value={formData.location_type || 'shop'}
                                            onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                                            className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                        >
                                            <option value="shop">Shop</option>
                                            <option value="storage">Storage</option>
                                            <option value="warehouse">Warehouse</option>
                                        </select>
                                    </div>
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-600 mb-1'>Address</label>
                                        <input
                                            type="text"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder='Enter address (optional)'
                                            className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className='block text-sm font-medium text-gray-600 mb-1'>Description</label>
                                    <input
                                        type="text"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder='Enter description (optional)'
                                        className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                    />
                                </div>
                            )}
                        </div>
                        <div className='flex justify-end mt-5 gap-3'>
                            <button onClick={resetForm} className='px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 duration-200 cursor-pointer'>Cancel</button>
                            <button onClick={handleSave} className='px-5 py-2 rounded-lg bg-[#008C83] hover:bg-[#00675B] text-white duration-200 cursor-pointer flex items-center gap-2'>
                                <FiCheck /> {editingId ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className='py-20 text-center text-gray-400'>Loading...</div>
                ) : (
                    <table className='w-full'>
                        <thead className='bg-[#F5F5F5]'>
                            <tr>
                                <th className='text-left p-4 font-semibold w-12'>#</th>
                                <th className='text-left p-4 font-semibold'>Name</th>
                                {activeTab === 'locations' ? (
                                    <>
                                        <th className='text-left p-4 font-semibold'>Type</th>
                                        <th className='text-left p-4 font-semibold'>Address</th>
                                    </>
                                ) : (
                                    <th className='text-left p-4 font-semibold'>Description</th>
                                )}
                                <th className='text-left p-4 font-semibold'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getCurrentData().map((item, idx) => (
                                <tr key={item.id} className='border-t hover:bg-gray-50 duration-200'>
                                    <td className='p-4 text-sm text-gray-400'>{idx + 1}</td>
                                    <td className='p-4 text-sm font-medium'>{item.name}</td>
                                    {activeTab === 'locations' ? (
                                        <>
                                            <td className='p-4 text-sm'>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.location_type === 'shop' ? 'bg-blue-100 text-blue-700' : item.location_type === 'storage' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {item.location_type}
                                                </span>
                                            </td>
                                            <td className='p-4 text-sm text-gray-500'>{item.address || '—'}</td>
                                        </>
                                    ) : (
                                        <td className='p-4 text-sm text-gray-500'>{item.description || '—'}</td>
                                    )}
                                    <td className='p-4 text-sm'>
                                        <span className='flex items-center gap-4'>
                                            <button onClick={() => openEditForm(item)} className='text-lg text-gray-500 hover:text-[#008C83] cursor-pointer duration-200'><GoPencil /></button>
                                            <button onClick={() => handleDelete(item.id, item.name)} className='text-lg text-red-400 hover:text-red-600 cursor-pointer duration-200'><FiTrash2 /></button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {getCurrentData().length === 0 && (
                                <tr><td colSpan={activeTab === 'locations' ? 5 : 4} className='p-10 text-center text-gray-400'>No {activeTab} found. Add one to get started.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Settings
