'use client'
import React, {useState} from 'react'
import Image from 'next/image'
import { login } from '@/util/apiService'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const result = await login(username, password)
      if (!result.success) {
        setError(result.message || 'Login failed')
      } else {
        window.location.href = '/client/dashboard'
      }
    } catch (err) {
      setError('An error occurred during login')
    }
  }

  const handleUsernameChange = (e) => setUsername(e.target.value)
  const handlePasswordChange = (e) => setPassword(e.target.value)

  return (
    <div className='w-full h-screen bg-[#E9FFF5] flex flex-col lg:flex-row justify-center items-center'>
        <div className='hidden lg:flex h-full w-[50vw] justify-center items-center'>
            <div className='w-[40vw] h-[90%] bg-[#5CBCA9] rounded-4xl text-white text-3xl font-bold relative'>
                <Image src="/svg/logo.svg" alt="logo" width={150} height={70} className='absolute top-8 left-10'/>
                <span className='absolute left-10 bottom-10'>
                    <h2 className='font-bold text-5xl '>
                        Sahyog <p className='text-[#164630] mt-2'>Home Mart</p>
                    </h2>
                    <p className='text-xl font-light text-black mt-7 tracking-wider'>
                        Your Friendly Neighborhood <br /> Convenience Store 
                    </p>
                </span>
            </div>
        </div>
        <div className='h-full w-full lg:w-[50vw] flex flex-col justify-center items-center lg:items-start px-6 sm:px-12 lg:pl-36 lg:pr-8 gap-8 lg:gap-10'>
            <div className='flex flex-col items-center lg:items-start lg:hidden mb-2'>
                <Image src="/svg/logo.svg" alt="logo" className='bg-[#FFA503] rounded-lg' width={100} height={50} />
                <h2 className='font-bold text-2xl text-[#5CBCA9] mt-3'>Sahyog <span className='text-[#164630]'>Home Mart</span></h2>
            </div>
            <span className='gap-3 flex flex-col items-center lg:items-start text-center lg:text-left'>
            <h2 className='text-[#014D48] text-2xl sm:text-3xl lg:text-4xl font-extrabold'>Login to Account</h2>
            <p>{error && <span className='text-red-500'>{error}</span>}</p>
            <p className='text-[#3E6D64] font-sm font-light text-sm sm:text-base'>Please enter your id and password to login into your account</p>
            </span>
            <form onSubmit={handleLogin} className='flex flex-col gap-5 w-full max-w-sm lg:max-w-none'>
            <span className='flex flex-col gap-2'>
                <label htmlFor="username">Username:</label>
                <input type="text" name="username" id="username" placeholder='username@showa.online' required autoFocus className='bg-[#F1F4F9] px-4 w-full lg:w-[20vw] text-black py-2.5 rounded-md border-2 border-gray-300' onChange={handleUsernameChange} />
            </span>
            <span className='flex flex-col gap-2 mt-3'>
                <label htmlFor="password">Password:</label>
                <input type="password" name="password" id="password" placeholder='********' required className='bg-[#F1F4F9] px-4 w-full lg:w-[20vw] text-black py-2.5 rounded-md border-2 border-gray-300' onChange={handlePasswordChange} />
            </span>
            <button type="submit" className='bg-[#014D48] text-white px-4 w-full lg:w-[20vw] py-2.5 rounded-md font-semibold hover:bg-[#366055] transition-colors mt-5'>Login</button>
            </form>
        </div>
    </div>
  )
}

export default Login