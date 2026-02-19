'use client'
import { usePathname } from 'next/navigation'
import { MdDashboard } from "react-icons/md"
import { FaBox } from "react-icons/fa6"
import { IoCartSharp } from "react-icons/io5"
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { TbReport } from "react-icons/tb";
import { LuUserCog } from "react-icons/lu";
import { HiMiniUserGroup } from "react-icons/hi2";
import { BiPulse } from "react-icons/bi";
import { RiTruckLine } from "react-icons/ri";
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import ClientTopAvatar from './ClientTopAvatar'

const SideNav = ({ children }) => {
    const pathname = usePathname();
    const [hovered, setHovered] = useState(false);
    if (!pathname.startsWith('/client')) {
        return <>{children}</>;
    }

    const links = [
        { name: 'Dashboard', path: '/client/dashboard', icon: <MdDashboard /> },
        { name: 'Inventory', path: '/client/inventory', icon: <FaBox /> },
        { name: 'Purch. & Supply', path: '/client/purchase-supply', icon: <IoCartSharp /> },
        { name: 'Suppliers', path: null, icon: <RiTruckLine /> },
        { name: 'Billing', path: '/client/billing', icon: <FaFileInvoiceDollar /> },
        { name: 'Reports', path: '/client/reports', icon: <TbReport /> },
        { name: 'Customers', path: null, icon: <HiMiniUserGroup /> },
        { name: 'User Role', path: null, icon: <LuUserCog /> },
        { name: 'Activity Log', path: null, icon: <BiPulse /> },
    ]

    return (
        <>
            <div className={`h-screen bg-[#56A291] flex flex-col fixed left-0 top-0 z-50 ${hovered ? 'w-52' : 'w-20'} transition-all duration-300`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className=' rounded-xl mt-5 p-2 mx-auto'>
                    <Image src="/image/store-logo.png" alt="Store Logo" width={60} height={60} />
                </div>

                <div className='flex flex-col w-full mt-5 gap-4'>
                    {links.map((link) => {
                        const isActive = Boolean(link.path && pathname.startsWith(link.path))
                        const commonClass = `w-full flex ${hovered ? 'flex-row gap-3 px-5' : 'flex-col px-0'} items-center ${hovered ? 'justify-start' : 'justify-center'} py-3.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-white/55 hover:text-white'}`

                        if (!link.path) {
                            return (
                                <button key={link.name} className={commonClass} type='button'>
                                    <span className='text-[22px]'>{link.icon}</span>
                                    <span className={`text-sm whitespace-nowrap ${hovered ? 'inline' : 'hidden'} duration-200`}>{link.name}</span>
                                </button>
                            )
                        }

                        return (
                            <Link key={link.name} href={link.path} className={commonClass}>
                                <span className='text-[22px]'>{link.icon}</span>
                                <span className={`text-sm whitespace-nowrap ${hovered ? 'inline' : 'hidden'} duration-200`}>{link.name}</span>
                            </Link>
                        )
                    })}
                </div>
                <Image src='/svg/logo2.svg' alt="showa logo" width={60} height={60} className='mt-auto mx-auto mb-4' />
            </div>
            <div className='w-full h-screen pl-20'>
                <ClientTopAvatar />
                {children}
            </div>
        </>
    )
}

export default SideNav
