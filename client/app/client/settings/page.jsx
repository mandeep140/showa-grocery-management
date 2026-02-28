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
import { MdPhoneAndroid } from "react-icons/md"
import { IoCopyOutline } from "react-icons/io5"
import { IoCheckmarkDone } from "react-icons/io5"
import { BiPrinter } from "react-icons/bi"
import QRCode from 'react-qr-code'
import api from '@/util/api'
import {
    getPrinterSettings,
    savePrinterSettings,
    connectBluetoothPrinter,
    disconnectBluetoothPrinter,
    removePrinter,
    isBluetoothAvailable,
    testPrint,
    connectWifiPrinter,
} from '@/util/thermalPrinter'

const Settings = () => {
    const [activeTab, setActiveTab] = useState('categories')
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({})
    const [appUrl, setAppUrl] = useState('')
    const [copied, setCopied] = useState(false)

    // Printer states
    const [printerSettings, setPrinterSettings] = useState(null)
    const [printerConnecting, setPrinterConnecting] = useState(false)
    const [printerStatus, setPrinterStatus] = useState('')
    const [printerError, setPrinterError] = useState('')
    const [testPrinting, setTestPrinting] = useState(false)
    const [wifiIP, setWifiIP] = useState('')
    const [wifiPort, setWifiPort] = useState('9100')

    const tabs = [
        { id: 'categories', label: 'Categories', icon: <BiCategory /> },
        { id: 'brands', label: 'Brands', icon: <TbBrandAirtable /> },
        { id: 'locations', label: 'Locations', icon: <HiOutlineLocationMarker /> },
        { id: 'printer', label: 'Printer', icon: <BiPrinter /> },
        { id: 'phone', label: 'Phone Access', icon: <MdPhoneAndroid /> },
    ]

    useEffect(() => {
        fetchAll()
        // Load printer settings
        setPrinterSettings(getPrinterSettings())
        fetch('/api/network-info').then(r => r.json()).then(data => {
            if (data.ip) {
                const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000'
                setAppUrl(`https://${data.ip}:${port}/client/dashboard`)
            }
        }).catch(() => {
            if (typeof window !== 'undefined') setAppUrl(window.location.origin)
        })
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

    const copyUrl = () => {
        navigator.clipboard.writeText(appUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ===== Printer Functions =====
    const handleConnectBluetooth = async () => {
        setPrinterConnecting(true)
        setPrinterError('')
        setPrinterStatus('')
        try {
            const result = await connectBluetoothPrinter()
            setPrinterSettings(getPrinterSettings())
            setPrinterStatus(`Connected to ${result.name}`)
        } catch (err) {
            setPrinterError(err.message || 'Failed to connect')
        } finally {
            setPrinterConnecting(false)
        }
    }

    const handleConnectWifi = async () => {
        setPrinterConnecting(true)
        setPrinterError('')
        setPrinterStatus('')
        try {
            const result = await connectWifiPrinter(wifiIP, Number(wifiPort) || 9100)
            setPrinterSettings(getPrinterSettings())
            setPrinterStatus(`Connected to ${result.name}`)
        } catch (err) {
            setPrinterError(err.message || 'Failed to connect')
        } finally {
            setPrinterConnecting(false)
        }
    }

    const handleDisconnectPrinter = () => {
        removePrinter()
        setPrinterSettings(getPrinterSettings())
        setPrinterStatus('Printer disconnected')
        setPrinterError('')
        setTimeout(() => setPrinterStatus(''), 3000)
    }

    const handleSavePrinterSettings = () => {
        savePrinterSettings(printerSettings)
        setPrinterStatus('Settings saved!')
        setTimeout(() => setPrinterStatus(''), 3000)
    }

    const handleTestPrint = async () => {
        setTestPrinting(true)
        setPrinterError('')
        try {
            await testPrint()
            setPrinterStatus('Test receipt printed!')
        } catch (err) {
            setPrinterError(err.message || 'Print failed')
        } finally {
            setTestPrinting(false)
            setTimeout(() => setPrinterStatus(''), 3000)
        }
    }

    const updatePrinterSetting = (key, value) => {
        setPrinterSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className='w-full min-h-screen bg-[#E6FFFD] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:py-20 xl:px-15 xl:py-30'>
            <div className='w-full flex items-center justify-between mb-6 lg:mb-10'>
                <h2 className='font-semibold text-3xl sm:text-4xl'>Settings</h2>
            </div>

            <div className='mb-6 flex flex-wrap gap-2 sm:gap-3'>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 duration-200 cursor-pointer sm:px-6 sm:py-3 sm:text-base ${activeTab === tab.id ? 'bg-[#008C83] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        <span className='text-lg'>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className='bg-white rounded-xl p-4 sm:p-6 lg:p-8'>
                {activeTab === 'printer' ? (
                    <div className='w-full max-w-2xl'>
                        <h3 className='text-xl font-semibold mb-1'>Thermal Printer</h3>
                        <p className='text-sm text-gray-400 mb-6'>Connect a Bluetooth or WiFi thermal printer for receipt printing</p>

                        {/* Status messages */}
                        {printerStatus && (
                            <div className='mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium'>
                                {printerStatus}
                            </div>
                        )}
                        {printerError && (
                            <div className='mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium whitespace-pre-line'>
                                {printerError}
                            </div>
                        )}

                        {/* Connection Section */}
                        <div className='bg-[#F0FFFE] border border-[#008C83]/20 rounded-xl p-6 mb-6'>
                            <h4 className='font-semibold text-base mb-4'>Printer Connection</h4>

                            {printerSettings?.printerName ? (
                                <div className='flex items-center justify-between flex-wrap gap-3'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-lg bg-[#008C83]/10 flex items-center justify-center'>
                                            <BiPrinter className='text-xl text-[#008C83]' />
                                        </div>
                                        <div>
                                            <p className='font-medium text-gray-800'>{printerSettings.printerName}</p>
                                            <p className='text-xs text-gray-400 capitalize'>{printerSettings.printerType} · Connected</p>
                                        </div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={handleTestPrint}
                                            disabled={testPrinting}
                                            className='px-4 py-2 rounded-lg border border-[#008C83] text-[#008C83] text-sm font-medium hover:bg-[#E6FFFD] duration-150 cursor-pointer disabled:opacity-50'
                                        >
                                            {testPrinting ? 'Printing...' : 'Test Print'}
                                        </button>
                                        <button
                                            onClick={handleDisconnectPrinter}
                                            className='px-4 py-2 rounded-lg border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 duration-150 cursor-pointer'
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-6'>
                                    {/* Bluetooth Option */}
                                    <div className='border border-gray-200 rounded-xl p-5 bg-white'>
                                        <div className='flex items-center gap-2 mb-3'>
                                            <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                                                <svg className='w-4 h-4 text-blue-500' viewBox='0 0 24 24' fill='currentColor'><path d='M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z'/></svg>
                                            </div>
                                            <h5 className='font-semibold text-sm text-gray-700'>Bluetooth Printer</h5>
                                        </div>
                                        <p className='text-xs text-gray-400 mb-3'>Pair with a Bluetooth thermal printer using your browser</p>
                                        <button
                                            onClick={handleConnectBluetooth}
                                            disabled={printerConnecting}
                                            className='w-full py-2.5 rounded-lg bg-[#008C83] text-white text-sm font-semibold hover:bg-[#00756E] duration-150 cursor-pointer disabled:opacity-50'
                                        >
                                            {printerConnecting ? 'Searching...' : 'Connect Bluetooth'}
                                        </button>
                                        {!isBluetoothAvailable() && (
                                            <p className='mt-2 text-xs text-red-400'>Bluetooth not supported in this browser. Use Chrome or Edge.</p>
                                        )}
                                    </div>

                                    {/* WiFi Option */}
                                    <div className='border border-gray-200 rounded-xl p-5 bg-white'>
                                        <div className='flex items-center gap-2 mb-3'>
                                            <div className='w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center'>
                                                <svg className='w-4 h-4 text-green-500' viewBox='0 0 24 24' fill='currentColor'><path d='M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z'/></svg>
                                            </div>
                                            <h5 className='font-semibold text-sm text-gray-700'>WiFi Printer</h5>
                                        </div>
                                        <p className='text-xs text-gray-400 mb-3'>Connect to a WiFi/LAN thermal printer using IP address (same network)</p>
                                        <div className='mb-3 flex flex-col gap-2 sm:flex-row'>
                                            <input
                                                type='text'
                                                value={wifiIP}
                                                onChange={(e) => setWifiIP(e.target.value)}
                                                placeholder='Printer IP (e.g. 192.168.1.100)'
                                                className='flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#008C83]'
                                            />
                                            <input
                                                type='number'
                                                value={wifiPort}
                                                onChange={(e) => setWifiPort(e.target.value)}
                                                placeholder='9100'
                                                className='w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#008C83] sm:w-24'
                                            />
                                        </div>
                                        <button
                                            onClick={handleConnectWifi}
                                            disabled={printerConnecting || !wifiIP.trim()}
                                            className='w-full py-2.5 rounded-lg bg-[#008C83] text-white text-sm font-semibold hover:bg-[#00756E] duration-150 cursor-pointer disabled:opacity-50'
                                        >
                                            {printerConnecting ? 'Connecting...' : 'Connect WiFi Printer'}
                                        </button>
                                        <p className='mt-2 text-xs text-gray-400'>Common port is 9100 (RAW printing). Check your printer manual for the IP.</p>
                                    </div>

                                    <p className='text-xs text-gray-400 text-center'>Make sure your thermal printer is turned on and connected to the same network</p>
                                </div>
                            )}
                        </div>

                        {/* Paper Width */}
                        {printerSettings && (
                            <>
                                <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6'>
                                    <h4 className='font-semibold text-base mb-4'>Paper Size</h4>
                                    <div className='flex flex-col gap-3 sm:flex-row'>
                                        <button
                                            onClick={() => updatePrinterSetting('paperWidth', 32)}
                                            className={`flex-1 py-3 rounded-lg text-sm font-medium border duration-150 cursor-pointer ${
                                                printerSettings.paperWidth === 32
                                                    ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            58mm (32 chars)
                                        </button>
                                        <button
                                            onClick={() => updatePrinterSetting('paperWidth', 48)}
                                            className={`flex-1 py-3 rounded-lg text-sm font-medium border duration-150 cursor-pointer ${
                                                printerSettings.paperWidth === 48
                                                    ? 'border-[#008C83] bg-[#E6FFFD] text-[#008C83]'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            80mm (48 chars)
                                        </button>
                                    </div>
                                </div>

                                {/* Header / Footer */}
                                <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6'>
                                    <h4 className='font-semibold text-base mb-4'>Receipt Header</h4>
                                    <p className='text-xs text-gray-400 mb-3'>Customize your receipt header — shop name, address, phone etc.</p>
                                    <div className='space-y-3'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-600 mb-1'>Line 1 (Shop Name — printed large & bold)</label>
                                            <input
                                                type='text'
                                                value={printerSettings.headerLine1 || ''}
                                                onChange={(e) => updatePrinterSetting('headerLine1', e.target.value)}
                                                placeholder='e.g. SHOWA STORE'
                                                className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-600 mb-1'>Line 2 (Address / Info)</label>
                                            <input
                                                type='text'
                                                value={printerSettings.headerLine2 || ''}
                                                onChange={(e) => updatePrinterSetting('headerLine2', e.target.value)}
                                                placeholder='e.g. Main Market, City'
                                                className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-600 mb-1'>Line 3 (Phone / GST etc)</label>
                                            <input
                                                type='text'
                                                value={printerSettings.headerLine3 || ''}
                                                onChange={(e) => updatePrinterSetting('headerLine3', e.target.value)}
                                                placeholder='e.g. Ph: 9876543210'
                                                className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6'>
                                    <h4 className='font-semibold text-base mb-4'>Receipt Footer</h4>
                                    <p className='text-xs text-gray-400 mb-3'>Custom message at the bottom of the receipt (before &quot;Powered by showa.online&quot;)</p>
                                    <div className='space-y-3'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-600 mb-1'>Footer Line 1</label>
                                            <input
                                                type='text'
                                                value={printerSettings.footerLine1 || ''}
                                                onChange={(e) => updatePrinterSetting('footerLine1', e.target.value)}
                                                placeholder='e.g. Thank you! Visit again.'
                                                className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-600 mb-1'>Footer Line 2</label>
                                            <input
                                                type='text'
                                                value={printerSettings.footerLine2 || ''}
                                                onChange={(e) => updatePrinterSetting('footerLine2', e.target.value)}
                                                placeholder='e.g. Exchange within 7 days with bill'
                                                className='w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-[#008C83]'
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Receipt Preview */}
                                <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6'>
                                    <h4 className='font-semibold text-base mb-4'>Receipt Preview</h4>
                                    <div className='bg-white border border-gray-200 rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre max-w-xs mx-auto shadow-sm'>
                                        {printerSettings.headerLine1 && <div className='text-center font-bold text-sm'>{printerSettings.headerLine1}</div>}
                                        {printerSettings.headerLine2 && <div className='text-center'>{printerSettings.headerLine2}</div>}
                                        {printerSettings.headerLine3 && <div className='text-center'>{printerSettings.headerLine3}</div>}
                                        <div className='text-center'>{'─'.repeat(printerSettings.paperWidth === 48 ? 32 : 24)}</div>
                                        <div>Invoice: INV-001</div>
                                        <div>Date: 23/02/2026 12:00</div>
                                        <div className='text-center'>{'─'.repeat(printerSettings.paperWidth === 48 ? 32 : 24)}</div>
                                        <div className='font-bold'>Item        Qty   Amt</div>
                                        <div>Sample Item  2   ₹200</div>
                                        <div>Other Item   1   ₹150</div>
                                        <div className='text-center'>{'─'.repeat(printerSettings.paperWidth === 48 ? 32 : 24)}</div>
                                        <div className='font-bold'>TOTAL           ₹350.00</div>
                                        <div className='text-center'>{'─'.repeat(printerSettings.paperWidth === 48 ? 32 : 24)}</div>
                                        {printerSettings.footerLine1 && <div className='text-center'>{printerSettings.footerLine1}</div>}
                                        {printerSettings.footerLine2 && <div className='text-center'>{printerSettings.footerLine2}</div>}
                                        <div className='text-center mt-1 text-gray-400'>Powered by showa.online</div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSavePrinterSettings}
                                    className='w-full py-3 rounded-lg bg-[#008C83] text-white font-semibold hover:bg-[#00756E] duration-150 cursor-pointer flex items-center justify-center gap-2'
                                >
                                    <FiCheck className='text-lg' /> Save Printer Settings
                                </button>
                            </>
                        )}
                    </div>
                ) : activeTab === 'phone' ? (
                    <div className='flex flex-col items-center justify-center py-6'>
                        <h3 className='text-xl font-semibold mb-1'>Open App on Phone</h3>
                        <p className='text-sm text-gray-400 mb-8'>Connect to the same Wi-Fi, then scan the QR or open the URL manually</p>

                        <div className='p-4 rounded-2xl border-2 border-[#008C83]/20 bg-[#F0FFFE] inline-block mb-6'>
                            {appUrl ? (
                                <QRCode
                                    value={appUrl}
                                    size={220}
                                    fgColor='#008C83'
                                    bgColor='#F0FFFE'
                                />
                            ) : (
                                <div className='w-55 h-55 flex items-center justify-center text-gray-300 text-sm'>Fetching IP...</div>
                            )}
                        </div>

                        <div className='flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full max-w-sm mb-3'>
                            <span className='flex-1 text-sm font-mono text-gray-700 break-all'>{appUrl || '...'}</span>
                            <button
                                onClick={copyUrl}
                                className='text-gray-400 hover:text-[#008C83] duration-200 cursor-pointer shrink-0'
                                title='Copy URL'
                            >
                                {copied ? <IoCheckmarkDone className='text-xl text-[#008C83]' /> : <IoCopyOutline className='text-xl' />}
                            </button>
                        </div>

                        <p className='text-xs text-gray-400 text-center max-w-xs'>
                            Make sure both devices are on the same Wi-Fi network. The app uses HTTPS so your browser may show a certificate warning — just tap &quot;Advanced -&gt; Proceed&quot;.
                        </p>
                    </div>
                ) : (
                <>
                <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <h3 className='text-xl font-semibold capitalize'>{activeTab}</h3>
                    <button
                        onClick={openAddForm}
                        className='bg-[#008C83] hover:bg-[#00675B] text-white px-5 py-2 rounded-lg duration-200 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto'
                    >
                        <IoMdAdd /> Add {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Location'}
                    </button>
                </div>

                {showForm && (
                    <div className='bg-[#F0FFFE] border border-[#008C83]/20 rounded-xl p-4 sm:p-6 mb-6'>
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
                        <div className='mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3'>
                            <button onClick={resetForm} className='px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 duration-200 cursor-pointer'>Cancel</button>
                            <button onClick={handleSave} className='px-5 py-2 rounded-lg bg-[#008C83] hover:bg-[#00675B] text-white duration-200 cursor-pointer flex items-center justify-center gap-2'>
                                <FiCheck /> {editingId ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className='py-20 text-center text-gray-400'>Loading...</div>
                ) : (
                    <div className='w-full overflow-x-auto'>
                        <table className='w-full min-w-[760px]'>
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
                                                <td className='p-4 text-sm text-gray-500'>{item.address || '-'}</td>
                                            </>
                                        ) : (
                                            <td className='p-4 text-sm text-gray-500'>{item.description || '-'}</td>
                                        )}
                                        <td className='p-4 text-sm'>
                                            <div className='flex items-center gap-4'>
                                                <button onClick={() => openEditForm(item)} className='text-lg text-gray-500 hover:text-[#008C83] cursor-pointer duration-200'><GoPencil /></button>
                                                <button onClick={() => handleDelete(item.id, item.name)} className='text-lg text-red-400 hover:text-red-600 cursor-pointer duration-200'><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {getCurrentData().length === 0 && (
                                    <tr><td colSpan={activeTab === 'locations' ? 5 : 4} className='p-10 text-center text-gray-400'>No {activeTab} found. Add one to get started.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    )
}

export default Settings



