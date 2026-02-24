'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { HiOutlineXMark } from 'react-icons/hi2'
import { BsUpcScan } from 'react-icons/bs'
import { MdCameraswitch } from 'react-icons/md'

const BarcodeScanner = ({ isOpen, onClose, onBarcodeScanned }) => {
  const [mode, setMode] = useState('scanner') // 'scanner' or 'camera'
  const [lastScanned, setLastScanned] = useState('')
  const [scanStatus, setScanStatus] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const barcodeBuffer = useRef('')
  const barcodeTimeout = useRef(null)
  const html5QrCodeRef = useRef(null)
  const cameraContainerRef = useRef(null)
  const lastScanTime = useRef(0)

  // Beep sound using audio file
  const playBeep = useCallback(() => {
    try {
      const audio = new Audio('/audio/beep.mp3')
      audio.play().catch(e => console.error('Beep error:', e))
    } catch (e) {
      console.error('Beep error:', e)
    }
  }, [])

  // Handle barcode result (from both scanner and camera)
  const handleBarcode = useCallback((code) => {
    const now = Date.now()
    // Debounce: ignore if same barcode scanned within 1 second
    if (now - lastScanTime.current < 1000) return
    lastScanTime.current = now

    setLastScanned(code)
    setScanStatus('Scanning...')
    playBeep()
    onBarcodeScanned(code, (success, productName) => {
      if (success) {
        setScanStatus(`✓ ${productName} added`)
      } else {
        setScanStatus(`✗ Product not found: ${code}`)
      }
      // Clear status after 2 seconds
      setTimeout(() => setScanStatus(''), 2000)
    })
  }, [onBarcodeScanned, playBeep])

  // Hardware barcode scanner listener (reads as keyboard input)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field that's not part of the scanner
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === 'Enter') {
        e.preventDefault()
        const code = barcodeBuffer.current.trim()
        if (code.length >= 3) {
          handleBarcode(code)
        }
        barcodeBuffer.current = ''
        return
      }

      // Only accept printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        barcodeBuffer.current += e.key

        // Reset buffer after 100ms of no input (scanner types fast)
        if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current)
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = ''
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current)
    }
  }, [isOpen, handleBarcode])

  // Helper to safely stop and clear scanner
  const cleanupCamera = useCallback(() => {
    const scanner = html5QrCodeRef.current
    if (!scanner) return

    html5QrCodeRef.current = null

    scanner.stop()
      .then(() => {
        try { scanner.clear() } catch {}
      })
      .catch(() => {
        try { scanner.clear() } catch {}
      })
  }, [])

  // Camera scanner
  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      cleanupCamera()
      return
    }

    let mounted = true
    setCameraError('')

    const startCamera = async () => {
      try {
        // Request camera permission explicitly first
        try {
          await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
              // Stop the stream immediately, html5-qrcode will open its own
              stream.getTracks().forEach(track => track.stop())
            })
        } catch (permErr) {
          console.error('Permission error:', permErr)
          if (mounted) {
            setCameraError('Camera permission denied. Please allow camera access and try again.')
          }
          return
        }

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (!mounted) return

        // Wait a bit for DOM to be ready
        await new Promise(r => setTimeout(r, 300))
        if (!mounted) return

        const scanner = new Html5Qrcode('barcode-camera-view', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        })
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            disableFlip: false,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          },
          (decodedText) => {
            handleBarcode(decodedText)
          },
          () => {}
        )
      } catch (err) {
        console.error('Camera error:', err)
        if (mounted) setCameraError('Camera access denied or not available')
      }
    }

    startCamera()

    return () => {
      mounted = false
      cleanupCamera()
    }
  }, [isOpen, mode, handleBarcode, cleanupCamera, retryCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCamera()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Barcode Scanner</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex px-5 pt-4 gap-2">
          <button
            type="button"
            onClick={() => setMode('scanner')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold cursor-pointer duration-150 ${
              mode === 'scanner'
                ? 'bg-[#008C83] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <BsUpcScan className="h-4 w-4" />
            Hardware Scanner
          </button>
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold cursor-pointer duration-150 ${
              mode === 'camera'
                ? 'bg-[#008C83] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <MdCameraswitch className="h-4 w-4" />
            Camera Scan
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-5">
          {mode === 'scanner' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#E6FFFD] flex items-center justify-center">
                <BsUpcScan className="h-9 w-9 text-[#008C83]" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">Ready to Scan</p>
              <p className="text-sm text-gray-400 mb-1">Use your barcode scanner gun to scan products</p>
              <p className="text-xs text-gray-300">Scanner will continuously listen for barcodes</p>

              {/* Scanning animation */}
              <div className="mt-6 mx-auto w-48 h-12 border-2 border-dashed border-[#008C83]/30 rounded-lg relative overflow-hidden">
                <div className="absolute inset-x-0 h-0.5 bg-[#008C83] animate-scan-line" />
              </div>
            </div>
          ) : (
            <div>
              <div
                id="barcode-camera-view"
                ref={cameraContainerRef}
                className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"
              />
              {cameraError && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-red-500 mb-3">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError('')
                      setRetryCount(c => c + 1)
                    }}
                    className="px-4 py-2 bg-[#008C83] text-white text-sm font-semibold rounded-lg hover:bg-[#00756E] cursor-pointer duration-150"
                  >
                    Allow Camera & Retry
                  </button>
                  <p className="mt-2 text-xs text-gray-400">Make sure camera permission is allowed in browser settings</p>
                </div>
              )}
              {!cameraError && <p className="mt-3 text-xs text-gray-400 text-center">Point camera at barcode to scan</p>}
            </div>
          )}

          {/* Status Display */}
          {scanStatus && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium text-center ${
              scanStatus.startsWith('✓')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : scanStatus.startsWith('✗')
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {scanStatus}
            </div>
          )}

          {lastScanned && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">Last scanned: <span className="font-mono font-medium text-gray-600">{lastScanned}</span></p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        .animate-scan-line {
          animation: scanLine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default BarcodeScanner
