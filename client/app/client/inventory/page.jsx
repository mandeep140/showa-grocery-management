'use client'
import React, { useState } from 'react'
import { VscDebugRestart } from "react-icons/vsc";
import { BiTransfer } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import Link from 'next/link';
import { RiFolderReduceFill } from "react-icons/ri";



const inventoryData = [
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
        {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
        {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
        {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
        {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
        {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    },
    {
        name: "Tata Salt",
        category: "Grocery",
        unit: 'pcs',
        shopStock: 100,
        storageStock: 500,
        minStock: 50,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
        name: "Amul Butter",
        category: "Dairy",
        unit: 'pcs',
        shopStock: 15,
        storageStock: 200,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 15,
    },
    {
        name: "Britannia Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 30,
        storageStock: 100,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    {
        name: "Fresh Apples",
        category: "Fruits",
        unit: 'kg',
        shopStock: 20,
        storageStock: 50,
        minStock: 5,
        expireDate: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        name: "Green Grapes",
        category: "Fruits",
        unit: 'kg',
        shopStock: 0,
        storageStock: 30,
        minStock: 5,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    },
    {
        name: "Fresh Milk",
        category: "Dairy",
        unit: 'liters',
        shopStock: 10,
        storageStock: 100,
        minStock: 20,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    {
        name: "Brown Bread",
        category: "Bakery",
        unit: 'pcs',
        shopStock: 5,
        storageStock: 50,
        minStock: 10,
        expireDate: Date.now() + 1000 * 60 * 60 * 24 * 2,
    }
]



const Inventory = () => {
    const perPage = 10
    const [currentPage, setCurrentPage] = useState(1)

    const paginatedData = inventoryData.slice((currentPage - 1) * perPage, currentPage * perPage)
    const totalPages = Math.ceil(inventoryData.length / perPage)

    const getPageNumbers = () => {
        const pages = []
        
        if (totalPages <= 4) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            const showPrevious = currentPage - 1
            const showNext = currentPage + 1
            if (currentPage > 3) {
                pages.push('...')
            }
            if (showPrevious > 1 && showPrevious < totalPages) {
                pages.push(showPrevious)
            }
            if (currentPage !== 1 && currentPage !== totalPages) {
                pages.push(currentPage)
            }
            if (showNext < totalPages && showNext > 1) {
                pages.push(showNext)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }
        
        return pages
    }

    return (
        <div className='w-full min-h-screen px-15 py-30 bg-[#E6FFFD]'>
            <span className='w-full flex items-center justify-between gap-4 mb-10'>
                <h2 className='font-semibold text-4xl'>Inventory</h2>
                <span className='gap-2 flex'>
                    <Link href="/client/inventory/reduce" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><RiFolderReduceFill /> Reduce</Link>
                    <Link href="/client/inventory/return" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><VscDebugRestart /> Return</Link>
                    <Link href="/client/inventory/transfer" className='bg-white px-5 hover:bg-gray-100 py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><BiTransfer /> Transfer</Link>
                    <Link href="/client/inventory/add" className='bg-[#008C83] px-5 hover:bg-[#00675B] text-white py-2 rounded-lg duration-200 cursor-pointer flex gap-2 items-center'><IoMdAdd /> Add Product</Link>
                </span>
            </span>

            {/* search box section */}
            <div className='w-full h-20 bg-white rounded-lg flex items-center justify-between px-8'>
                <span className='p-4 border border-gray-200 rounded-xl flex items-center justify-center w-[70%]'>
                    <CiSearch />
                    <input type="text" placeholder={`Search by product name or barcode`} className='ml-2 w-full h-full border-none outline-none' />
                </span>
                <button className='p-3 rounded-lg ml-auto border border-gray-300'>Scan Barcode</button>

                {/* category filters */}
                <div>
                    <select className='ml-4 p-3 rounded-lg border border-gray-300'>
                        <option value="">All Categories</option>
                        <option value="fruits">Fruits</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="dairy">Dairy</option>
                        <option value="bakery">Bakery</option>
                    </select>
                </div>
            </div>

            <div>
                <table className='w-full mt-6 bg-white rounded-t-lg overflow-hidden'>
                    <thead className='bg-[#F5F5F5] '>
                        <tr>
                            <th className='text-left p-4 font-semibold'>Product Name</th>
                            <th className='text-left p-4 font-semibold'>Category</th>
                            <th className='text-left p-4 font-semibold'>Shop Stock</th>
                            <th className='text-left p-4 font-semibold'>Storage Stock</th>
                            <th className='text-left p-4 font-semibold'>Min Stock</th>
                            <th className='text-left p-4 font-semibold'>Expire Date</th>
                            <th className='text-left p-4 font-semibold'>Status</th>
                            <th className='text-left p-4 font-semibold'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item, index) => (
                            <tr key={index} className={`border-t ${item.shopStock === 0 ? 'bg-red-200' : new Date(item.expireDate) < Date.now() ? 'bg-red-100' : (Date.now() + 1000 * 60 * 60 * 24 * 10) > item.expireDate ? 'bg-orange-100' : item.shopStock < item.minStock ? 'bg-yellow-100' : 'hover:bg-gray-50'} duration-200 `}>
                                <td className='p-6 text-sm'>{item.name}</td>
                                <td className='p-6 text-sm'>{item.category}</td>
                                <td className='p-6 text-sm'>{item.shopStock} {item.unit}</td>
                                <td className='p-6 text-sm'>{item.storageStock} {item.unit}</td>
                                <td className='p-6 text-sm'>{item.minStock} {item.unit}</td>
                                <td className='p-6 text-sm'>{new Date(item.expireDate).toLocaleDateString()}</td>
                                <td className='p-6 text-sm'>
                                    {item.shopStock === 0 ? (
                                        <span className='text-red-600 font-medium'>Out of Stock</span>
                                    ) : (new Date(item.expireDate) < Date.now()) ? (
                                        <span className='text-red-600 font-medium'>Expired</span>
                                    ) : (Date.now() + 1000 * 60 * 60 * 24 * 10) > item.expireDate ? (
                                        <span className='text-orange-600 font-medium'>Expiring Soon</span>
                                    ) : item.shopStock < item.minStock ? (
                                        <span className='text-yellow-600 font-medium'>Low Stock</span>
                                    ) : (
                                        <span className='text-green-600 font-medium'>In Stock</span>
                                    )}
                                </td>
                                <td className='p-6 text-sm gap-4 flex items-center justify-start'>
                                    <Link href={`/client/inventory/${encodeURIComponent(item.name)}/view`} className='text-lg text-green-500 cursor-pointer'><FaEye /></Link>
                                    <Link href={`/client/inventory/${encodeURIComponent(item.name)}/edit`} className='text-lg text-gray-500 cursor-pointer'><GoPencil /></Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pt-7 pb-4 px-4 rounded-b-lg flex justify-between items-center bg-[#FAFAFA]">
                    <p className='font-light text-md tracking-wide'>showing {paginatedData.length} of {inventoryData.length} items</p>
                    <div className='flex justify-center items-center gap-4'>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                        >
                            Previous
                        </button>
                        <div>
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-4 py-2 mx-1">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 mx-1 rounded-lg ${currentPage === page ? 'bg-[#008C83] text-white' : 'bg-gray-300'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 mx-1 bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Inventory