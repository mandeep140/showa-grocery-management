'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IoMdArrowBack } from "react-icons/io";
import JsBarcode from 'jsbarcode';
import { FaBox } from 'react-icons/fa';

const product = {
    name: "Tata salt 1KG",
    category: "Spices",
    brand: "Tata",
    unit: "pcs",
    sellingPrice: 22.50,
    minimumStock: 20,
    bulkQuantity: 20,
    bulkPrice: 17.59,
    expireDate: "2024-12-31",
    productCode: "TS1KG",
}


const View = () => {
    const params = useParams();
    const { id } = params;
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (barcodeRef.current) {
            JsBarcode(barcodeRef.current, product.productCode, {
                format: "CODE128",
                width: 2,
                height: 70,
                displayValue: false,
                fontSize: 16,
                margin: 10
            });
        }
    }, []);

    return (
        <div className='w-full min-h-screen px-15 py-20 bg-[#E6FFFD]'>
            <Link href="/client/inventory" className='flex items-center mb-8 hover:text-gray-500 duration-200'> <IoMdArrowBack /> &nbsp; Back to inventory</Link>
            <h1 className='text-3xl font-bold mb-10'>Product Details - {id}</h1>
            <div className='w-[75%] mx-auto rounded-xl bg-white p-6 flex flex-col gap-6'>
                <h2 className='font-bold text-xl mb-2'>Basic Information</h2>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Product name</p>
                        <p className='font-semibold text-md'>{product.name}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Product code</p>
                        <p className='text-md'>{product.productCode}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Category</p>
                        <p className=' text-md'>{product.category}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Brand</p>
                        <p className=' text-md'>{product.brand}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Unit</p>
                        <p className='text-md'>{product.unit}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Selling price</p>
                        <p className='font-semibold text-md text-green-400'>₹ {product.sellingPrice}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Bulk quantity</p>
                        <p className=' text-md'>{product.bulkQuantity}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Bulk price</p>
                        <p className='font-semibold text-md text-green-400'>₹ {product.bulkPrice}</p>
                    </span>
                </div>
                <div className='w-full flex'>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Minimum stock level</p>
                        <p className=' text-md'>{product.minimumStock}</p>
                    </span>
                    <span className='w-[50%]'>
                        <p className='text-gray-400 text-sm'>Expire date</p>
                        <p className=' text-md'>{product.expireDate}</p>
                    </span>
                </div>

                <hr />
                <div>
                    <h2 className='font-bold text-xl mb-4'>Barcode</h2>
                    <span className='w-full flex justify-start items-center bg-gray-50 p-8 rounded-lg'>
                        <svg ref={barcodeRef}></svg>
                        <p className='ml-4 font-bold text-xl'>{product.productCode}</p>
                    </span>
                </div>
            </div>
            <div className='w-[75%] mx-auto mt-10 rounded-xl bg-white p-6 flex flex-col gap-6'>
                <h2 className='font-bold text-xl mb-4'>Stock summary</h2>
                <div className='w-full flex gap-4'>
                    <div className='w-1/3 flex flex-col items-start gap-2 bg-[#E8F5E9] text-[#2E7D32] p-6 rounded-lg'>
                        <span className='flex items-center text-md gap-2 font-light'><FaBox /> Shop stock</span>
                        <p className='font-bold text-xl'>125</p>
                        <p className='font-light text-sm'>Available on shop floor</p>
                    </div>
                    <div className='w-1/3 flex flex-col items-start gap-2 bg-[#E3F2FD] text-[#1976D2] p-6 rounded-lg'>
                        <span className='flex items-center text-md gap-2 font-light'><FaBox /> Storage stock</span>
                        <p className='font-bold text-xl'>325</p>
                        <p className='font-light text-sm'>In storage/godown</p>
                    </div>
                    <div className='w-1/3 flex flex-col items-start gap-2 bg-[#E0F2F1] text-[#00796B] p-6 rounded-lg'>
                        <span className='flex items-center text-md gap-2 font-light'><FaBox /> Total stock</span>
                        <p className='font-bold text-xl'>450</p>
                        <p className='font-light text-sm'>Combined inventory</p>
                    </div>
                </div>
            </div>
            <div className='w-[75%] mx-auto mt-10 rounded-xl bg-white p-6 flex flex-col gap-6'>
                <h2 className='font-bold text-xl mb-4'>Recent History</h2>
                <div className='w-full rounded-xl bg-gray-50 flex items-center justify-between px-4 py-6'>
                    <span >
                        <p className='font-semibold mb-2'>Last purchase</p>
                        <p className='text-sm text-gray-400'>{new Date().toLocaleDateString()} • 50 units</p>
                    </span>
                    <p className='text-green-600 font-semibold'>₹1270</p>
                </div>
                <div className='w-full rounded-xl bg-gray-50 flex items-center justify-between px-4 py-6'>
                    <span >
                        <p className='font-semibold mb-2'>Last sale</p>
                        <p className='text-sm text-gray-400'>{new Date().toLocaleDateString()} • 5 units</p>
                    </span>
                    <p className='text-green-600 font-semibold'>₹250</p>
                </div>
                <div className='w-full rounded-xl bg-gray-50 flex items-center justify-between px-4 py-6'>
                    <span >
                        <p className='font-semibold mb-2'>Last adjustment</p>
                        <p className='text-sm text-gray-400'>{new Date().toLocaleDateString()} • 5 units (Damaged)</p>
                    </span>
                    <p className='text-red-600 font-semibold'>- ₹50</p>
                </div>
            </div>
        </div>
    )
}

export default View