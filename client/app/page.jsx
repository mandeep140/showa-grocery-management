import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Home = () => {
  return (
    <div className='min-h-screen bg-[#E9FFF5] flex flex-col'>
      <header className='flex items-center justify-between px-6 sm:px-10 py-4'>
        <div className='flex items-center gap-3'>
          <span className='font-bold text-lg sm:text-xl text-[#014D48]'>Sahyog Home Mart</span>
        </div>
        <Link href="/login" className='text-sm font-medium text-[#014D48] hover:text-[#5CBCA9] transition-colors'>
          Login
        </Link>
      </header>

      <main className='flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-10 gap-6'>
          <Image src="/svg/logo.svg" className='bg-[#FFA503] rounded-lg' alt="logo" width={100} height={80} />
        <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#014D48] leading-tight'>
          Sahyog <span className='text-[#5CBCA9]'>Home Mart</span>
        </h1>
        <p className='text-gray-500 max-w-md text-sm sm:text-base'>
          Your Friendly Neighborhood Convenience Store — Manage inventory, billing, purchases and more.
        </p>
        <Link
          href="/client/dashboard"
          className='mt-2 inline-flex items-center gap-2 bg-[#014D48] text-white px-8 py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-[#366055] transition-colors shadow-lg'
        >
          Continue to Dashboard
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </main>

      <footer className='text-center py-4 text-xs text-gray-400'>
        Powered by showa.online
      </footer>
    </div>
  )
}

export default Home