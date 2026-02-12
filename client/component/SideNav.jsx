'use client'
import { usePathname } from 'next/navigation'
import { MdDashboard } from "react-icons/md"
import { FaBox } from "react-icons/fa6"
import { IoCartSharp } from "react-icons/io5"
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { TbReport } from "react-icons/tb";
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'

const SideNav = ({ children }) => {
    const pathname = usePathname();
    const [hovered, setHovered] = useState(false);
    if (!pathname.startsWith('/client')) {
        return <>{children}</>;
    }

    const links = [
        {
            name: 'Dashboard', path: '/client/dashboard', icon: <MdDashboard />
        },
        {
            name: 'Inventory', path: '/client/inventory', icon: <FaBox />
        },
        {
            name: 'Purchase & Supply', path: '/client/purchase-supply', icon: <IoCartSharp />
        },
        {
            name: 'Billing', path: '/client/billing', icon: <FaFileInvoiceDollar />
        },
        {
            name: 'Reports', path: '/client/reports', icon: <TbReport />
        }
    ]

    return (
        <>
            <div className={`h-screen bg-[#56A291] flex flex-col fixed left-0 top-0 z-50 ${hovered ? 'w-[50' : 'w-20'} transition-all duration-300`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className=' rounded-xl mt-5 p-2 mx-auto'>
                    <Image src="/image/store-logo.png" alt="Store Logo" width={60} height={60} />
                </div>

                <div className='flex flex-col w-full mt-5 gap-4'>
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.path}
                            className={`w-full flex ${hovered ? 'flex-row gap-3 px-5' : 'flex-col px-0'} items-center justify-${hovered ? 'start' : 'center'} py-4  hover:text-white transition-all duration-300 ${pathname.includes(link.path) ? ' text-white' : 'text-white/40'}`}
                        >
                            <span className='text-2xl'>{link.icon}</span>
                            <span className={`text-sm whitespace-nowrap ${hovered ? 'inline' : 'hidden'} duration-200`}>{link.name}</span>
                        </Link>
                    ))}
                </div>
                <Image src='/svg/logo2.svg' alt="showa logo" width={60} height={60} className='mt-auto mx-auto mb-4' />
            </div>
            <div className='w-full h-screen pl-20'>
                {children}
            </div>
        </>
    )
}

export default SideNav