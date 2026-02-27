'use client'
import { usePathname } from 'next/navigation'
import { MdDashboard, MdOutlineReceiptLong } from "react-icons/md"
import { FaBox } from "react-icons/fa6"
import { IoCartSharp } from "react-icons/io5"
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { TbReport } from "react-icons/tb";
import { LuUserCog } from "react-icons/lu";
import { HiMiniUserGroup } from "react-icons/hi2";
import { BiPulse } from "react-icons/bi";
import { RiTruckLine } from "react-icons/ri";
import { FaWallet } from "react-icons/fa6";
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ClientTopAvatar from './ClientTopAvatar'
import { logout } from '@/util/apiService'
import { IoSettings } from "react-icons/io5";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { usePermissions } from '@/context/PermissionContext'

const SideNav = ({ children }) => {
    const pathname = usePathname();
    const [hovered, setHovered] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { hasAnyPermission, loading: permLoading } = usePermissions();
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    if (!pathname.startsWith('/client')) {
        return <>{children}</>;
    }

    const allLinks = [
        {
            name: 'Dashboard', path: '/client/dashboard', icon: <MdDashboard />, perms: null
        },
        {
            name: 'Inventory', path: '/client/inventory', icon: <FaBox />, perms: ['inventory_view']
        },
        {
            name: 'Supplier', path: '/client/supplier', icon: <RiTruckLine />, perms: ['supplier_view']
        },
        {
            name: 'Purchases', path: '/client/purchase', icon: <IoCartSharp />, perms: ['purchase_view']
        },
        {
            name: 'Billing', path: '/client/billing', icon: <FaFileInvoiceDollar />, perms: ['billing']
        },
        {
            name: 'Invoice', path: '/client/invoice', icon: <MdOutlineReceiptLong />, perms: ['invoice']
        },
        {
            name: 'Debts', path: '/client/debts', icon: <FaWallet />, perms: ['debts']
        },
        {
            name: 'Reports', path: '/client/reports', icon: <TbReport />, perms: ['reports']
        },
        { name: 'Customers', path: '/client/customer', icon: <HiMiniUserGroup />, perms: ['customers'] },
        {
            name: 'Settings', path: '/client/settings', icon: <IoSettings />, perms: null
        }
    ]

    const links = allLinks.filter(link => {
        if (!link.perms) return true; 
        return hasAnyPermission(...link.perms);
    });

    const expanded = hovered || mobileOpen;

    const sidebarContent = (
        <>
            <div className='rounded-xl mt-5 p-2 mx-auto'>
                <Image src="/image/store-logo.png" alt="Store Logo" width={60} height={60} />
            </div>

            <div className='flex flex-col w-full mt-5 gap-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide'>
                {links.map((link) => {
                    const isActive = Boolean(link.path && pathname.startsWith(link.path))
                    const commonClass = `w-full flex ${expanded ? 'flex-row gap-3 px-5' : 'flex-col px-0'} items-center ${expanded ? 'justify-start' : 'justify-center'} py-3.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-white/55 hover:text-white'}`

                    if (!link.path) {
                        return (
                            <button key={link.name} className={commonClass} type='button'>
                                <span className='text-[22px]'>{link.icon}</span>
                                <span className={`text-sm whitespace-nowrap ${expanded ? 'inline' : 'hidden'} duration-200`}>{link.name}</span>
                            </button>
                        )
                    }

                    return (
                        <Link key={link.name} href={link.path} className={commonClass}>
                            <span className='text-[22px]'>{link.icon}</span>
                            <span className={`text-sm whitespace-nowrap ${expanded ? 'inline' : 'hidden'} duration-200`}>{link.name}</span>
                        </Link>
                    )
                })}
            </div>
            {expanded && (
                <button onClick={() => logout()}
                    className="w-full text-center py-2 text-white hover:bg-red-500/10 transition-colors duration-200"> Logout
                </button>
            )}
            <Image src='/svg/logo2.svg' alt="showa logo" width={60} height={60} className='mt-auto mx-auto mb-4' />
        </>
    );

    return (
        <>
            <button
                onClick={() => setMobileOpen(true)}
                className='md:hidden fixed top-3 left-3 z-50 bg-[#56A291] text-white p-2 rounded-lg shadow-lg'
                aria-label='Open menu'
            >
                <HiMenuAlt2 className='text-2xl' />
            </button>

            {mobileOpen && (
                <div
                    className='md:hidden fixed inset-0 bg-black/40 z-50'
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className={`md:hidden fixed left-0 top-0 h-screen w-60 bg-[#56A291] flex flex-col z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button
                    onClick={() => setMobileOpen(false)}
                    className='absolute top-3 right-3 text-white/70 hover:text-white p-1'
                    aria-label='Close menu'
                >
                    <IoClose className='text-2xl' />
                </button>
                {sidebarContent}
            </div>

            <div className={`hidden md:flex h-screen bg-[#56A291] flex-col fixed left-0 top-0 z-50 ${hovered ? 'w-52' : 'w-20'} transition-all duration-300`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {sidebarContent}
            </div>

            <div className='w-full h-screen md:pl-20'>
                <ClientTopAvatar />
                {children}
            </div>
        </>
    )
}

export default SideNav