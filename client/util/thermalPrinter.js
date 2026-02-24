const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A

const COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_WIDTH_ON: [ESC, 0x21, 0x20],
  DOUBLE_SIZE_ON: [ESC, 0x21, 0x30],
  NORMAL_SIZE: [ESC, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
  FEED_LINE: [LF],
  FEED_LINES: (n) => [ESC, 0x64, n],
  CUT_PAPER: [GS, 0x56, 0x00],
  PARTIAL_CUT: [GS, 0x56, 0x01],
}

const PRINTER_SETTINGS_KEY = 'thermal_printer_settings'

const DEFAULT_SETTINGS = {
  headerLine1: '',
  headerLine2: '',
  headerLine3: '',
  footerLine1: '',
  footerLine2: '',
  paperWidth: 32,
  printerType: '',  
  printerName: '',
  printerId: '',
  wifiIP: '',
  wifiPort: 9100,
}

export function getPrinterSettings() {
  try {
    const saved = localStorage.getItem(PRINTER_SETTINGS_KEY)
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch { }
  return { ...DEFAULT_SETTINGS }
}

export function savePrinterSettings(settings) {
  try {
    localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch { return false }
}

export function isPrinterConfigured() {
  const s = getPrinterSettings()
  if (s.printerType === 'wifi') return !!(s.wifiIP && s.wifiPort)
  if (s.printerType === 'bluetooth') return !!s.printerName
  return false
}


function textToBytes(text) {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(text))
}

function repeatChar(char, count) {
  return char.repeat(count)
}

function padText(text, width, align = 'left') {
  const str = String(text).substring(0, width)
  if (align === 'right') return str.padStart(width)
  if (align === 'center') {
    const pad = Math.floor((width - str.length) / 2)
    return ' '.repeat(pad) + str + ' '.repeat(width - pad - str.length)
  }
  return str.padEnd(width)
}

function twoColumns(left, right, width) {
  const rightLen = right.length
  const leftLen = Math.max(1, width - rightLen - 1)
  return padText(left, leftLen) + ' ' + padText(right, rightLen, 'right')
}

export function buildReceiptData(order, settings) {
  const w = settings.paperWidth || 32
  let data = []

  data.push(...COMMANDS.INIT)

  data.push(...COMMANDS.ALIGN_CENTER)
  if (settings.headerLine1) {
    data.push(...COMMANDS.BOLD_ON, ...COMMANDS.DOUBLE_SIZE_ON)
    data.push(...textToBytes(settings.headerLine1), ...COMMANDS.FEED_LINE)
    data.push(...COMMANDS.NORMAL_SIZE, ...COMMANDS.BOLD_OFF)
    data.push(...COMMANDS.FEED_LINE)
  }
  if (settings.headerLine2) {
    data.push(...textToBytes(settings.headerLine2), ...COMMANDS.FEED_LINE)
  }
  if (settings.headerLine3) {
    data.push(...textToBytes(settings.headerLine3), ...COMMANDS.FEED_LINE)
  }

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  data.push(...COMMANDS.ALIGN_LEFT)
  if (order.invoice_id) {
    data.push(...textToBytes(`Invoice: ${order.invoice_id}`), ...COMMANDS.FEED_LINE)
  }
  if (order.date) {
    const d = new Date(order.date)
    data.push(...textToBytes(`Date: ${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`), ...COMMANDS.FEED_LINE)
  }
  if (order.customer_name && order.customer_name !== 'Walk-in Customer') {
    data.push(...textToBytes(`Customer: ${order.customer_name}`), ...COMMANDS.FEED_LINE)
  }
  if (order.payment_method) {
    data.push(...textToBytes(`Payment: ${order.payment_method.toUpperCase()}`), ...COMMANDS.FEED_LINE)
  }

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  const qtyW = 5, amtW = 8
  const itemW = w - qtyW - amtW - 2
  data.push(...COMMANDS.BOLD_ON)
  data.push(...textToBytes(padText('Item', itemW) + ' ' + padText('Qty', qtyW) + ' ' + padText('Amt', amtW, 'right')))
  data.push(...COMMANDS.FEED_LINE, ...COMMANDS.BOLD_OFF)
  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  // Items
  const items = order.items || []
  items.forEach(item => {
    const name = (item.name || item.product_name || '').substring(0, itemW)
    const qty = String(item.quantity)
    const amt = `Rs.${(item.selling_price * item.quantity).toFixed(0)}`
    if (name.length > itemW - 2) {
      data.push(...textToBytes(name), ...COMMANDS.FEED_LINE)
      data.push(...textToBytes(padText('', itemW) + ' ' + padText(qty, qtyW) + ' ' + padText(amt, amtW, 'right')))
    } else {
      data.push(...textToBytes(padText(name, itemW) + ' ' + padText(qty, qtyW) + ' ' + padText(amt, amtW, 'right')))
    }
    data.push(...COMMANDS.FEED_LINE)
  })

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  // Items count
  const totalItems = order.total_items || items.length
  const totalQty = order.total_qty || items.reduce((s, i) => s + i.quantity, 0)
  data.push(...textToBytes(twoColumns(`${totalItems} items`, `Qty: ${totalQty}`, w)), ...COMMANDS.FEED_LINE)

  // Totals
  const subtotal = order.subtotal || items.reduce((s, i) => s + (i.selling_price * i.quantity), 0)
  data.push(...textToBytes(twoColumns('Subtotal', `Rs.${Number(subtotal).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)

  if (order.tax_amount && Number(order.tax_amount) > 0) {
    data.push(...textToBytes(twoColumns('Tax', `Rs.${Number(order.tax_amount).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
  }
  if (order.discount_amount && Number(order.discount_amount) > 0) {
    data.push(...textToBytes(twoColumns('Discount', `-Rs.${Number(order.discount_amount).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
  }

  data.push(...textToBytes(repeatChar('=', w)), ...COMMANDS.FEED_LINE)

  data.push(...COMMANDS.BOLD_ON, ...COMMANDS.DOUBLE_HEIGHT_ON)
  data.push(...textToBytes(twoColumns('TOTAL', `Rs.${Number(order.total_amount || 0).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
  data.push(...COMMANDS.NORMAL_SIZE, ...COMMANDS.BOLD_OFF)

  if (order.received_amount !== undefined && order.received_amount !== null) {
    data.push(...textToBytes(twoColumns('Received', `Rs.${Number(order.received_amount).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
    const due = Number(order.total_amount) - Number(order.received_amount)
    if (due > 0) {
      data.push(...textToBytes(twoColumns('Due', `Rs.${due.toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
    }
  }

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  // Footer
  data.push(...COMMANDS.ALIGN_CENTER)
  if (settings.footerLine1) data.push(...textToBytes(settings.footerLine1), ...COMMANDS.FEED_LINE)
  if (settings.footerLine2) data.push(...textToBytes(settings.footerLine2), ...COMMANDS.FEED_LINE)

  data.push(...COMMANDS.FEED_LINE, ...textToBytes('Powered by showa.online'), ...COMMANDS.FEED_LINE)

  // Feed and cut
  data.push(...COMMANDS.FEED_LINES(4), ...COMMANDS.CUT_PAPER)

  return new Uint8Array(data)
}

export function buildCartReceiptData({ cart, subtotal, taxTotal, discount, total, received, dueAmount, customerName, paymentMode, invoiceId, totalItems, totalQty }, settings) {
  return buildReceiptData({
    invoice_id: invoiceId || '',
    date: new Date().toISOString(),
    customer_name: customerName || 'Walk-in Customer',
    payment_method: paymentMode,
    items: cart.map(item => ({ name: item.name, quantity: item.quantity, selling_price: item.selling_price })),
    subtotal, tax_amount: taxTotal, discount_amount: discount, total_amount: total, received_amount: received,
    total_items: totalItems || cart.length,
    total_qty: totalQty || cart.reduce((s, i) => s + i.quantity, 0),
  }, settings)
}


let bluetoothDevice = null
let bluetoothCharacteristic = null

const BT_KNOWN_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',  // Generic thermal printer
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',  // Some Chinese printers
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',  // ISSC/Microchip (many BLE printers)
  '0000ff00-0000-1000-8000-00805f9b34fb',  // Common Chinese BLE printers
  '0000fee7-0000-1000-8000-00805f9b34fb',  // Tencent / some printers
  '0000ffe0-0000-1000-8000-00805f9b34fb',  // HM-10 BLE modules (very common)
  '00001101-0000-1000-8000-00805f9b34fb',  // SPP (Serial Port Profile)
  '0000ae00-0000-1000-8000-00805f9b34fb',  // Some receipt printers
  '0000af00-0000-1000-8000-00805f9b34fb',  // Some receipt printers
]

const BT_KNOWN_WRITE_CHARS = [
  '00002af1-0000-1000-8000-00805f9b34fb',  // Generic printer write
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',  // Some BLE printers
  '49535343-8841-43f4-a8d4-ecbe34729bb3',  // ISSC write char
  '49535343-1e4d-4bd9-ba61-23c647249616',  // ISSC write char alt
  '0000ff02-0000-1000-8000-00805f9b34fb',  // Chinese printer write
  '0000ffe1-0000-1000-8000-00805f9b34fb',  // HM-10 write char
  '0000ae01-0000-1000-8000-00805f9b34fb',  // Receipt printer write
  '0000af01-0000-1000-8000-00805f9b34fb',  // Receipt printer write
]

async function findWritableCharacteristic(server) {
  for (const sUUID of BT_KNOWN_SERVICES) {
    try {
      const service = await server.getPrimaryService(sUUID)
      for (const cUUID of BT_KNOWN_WRITE_CHARS) {
        try {
          const ch = await service.getCharacteristic(cUUID)
          if (ch && (ch.properties.write || ch.properties.writeWithoutResponse)) {
            console.log(`[Printer] Found writable char ${cUUID} on service ${sUUID}`)
            return ch
          }
        } catch { }
      }
      try {
        const chars = await service.getCharacteristics()
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            console.log(`[Printer] Found writable char ${ch.uuid} on service ${sUUID}`)
            return ch
          }
        }
      } catch { }
    } catch { }
  }

  try {
    const services = await server.getPrimaryServices()
    for (const service of services) {
      console.log(`[Printer] Scanning service: ${service.uuid}`)
      try {
        const chars = await service.getCharacteristics()
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            console.log(`[Printer] Found writable char ${ch.uuid} on service ${service.uuid}`)
            return ch
          }
        }
      } catch { }
    }
  } catch { }

  return null
}

export async function connectBluetoothPrinter() {
  if (!navigator.bluetooth) {
    throw new Error('Bluetooth is not supported in this browser. Use Chrome or Edge on a device with Bluetooth.')
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: BT_KNOWN_SERVICES,
  })

  if (!device) throw new Error('No device selected')
  bluetoothDevice = device

  device.addEventListener('gattserverdisconnected', () => {
    console.log('[Printer] Bluetooth device disconnected')
    bluetoothCharacteristic = null
  })

  const server = await device.gatt.connect()
  const characteristic = await findWritableCharacteristic(server)

  if (!characteristic) {
    device.gatt.disconnect()
    bluetoothDevice = null
    throw new Error(
      'Could not find a writable characteristic on this printer.\n\n' +
      'Tips:\n' +
      '• Make sure the printer is ON and in pairing mode\n' +
      '• Try turning the printer OFF and ON again\n' +
      '• Some printers only support WiFi — use the WiFi option'
    )
  }

  bluetoothCharacteristic = characteristic

  const settings = getPrinterSettings()
  settings.printerType = 'bluetooth'
  settings.printerName = device.name || 'Bluetooth Printer'
  settings.printerId = device.id || ''
  savePrinterSettings(settings)

  return { success: true, name: device.name || 'Bluetooth Printer', id: device.id }
}

export function disconnectBluetoothPrinter() {
  try {
    if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
      bluetoothDevice.gatt.disconnect()
    }
  } catch { }
  bluetoothDevice = null
  bluetoothCharacteristic = null
}

async function reconnectBluetooth() {
  if (!bluetoothDevice) throw new Error('Bluetooth printer not connected. Please reconnect from Settings.')
  const server = await bluetoothDevice.gatt.connect()
  const ch = await findWritableCharacteristic(server)
  if (!ch) throw new Error('Reconnect failed: no writable characteristic')
  bluetoothCharacteristic = ch
}

async function writeChunk(chunk) {
  try {
    if (bluetoothCharacteristic.properties.writeWithoutResponse) {
      await bluetoothCharacteristic.writeValueWithoutResponse(chunk)
    } else {
      await bluetoothCharacteristic.writeValue(chunk)
    }
  } catch (err) {
    if (err.message?.includes('GATT') || err.message?.includes('disconnect') || err.message?.includes('connect')) {
      await reconnectBluetooth()
      if (bluetoothCharacteristic.properties.writeWithoutResponse) {
        await bluetoothCharacteristic.writeValueWithoutResponse(chunk)
      } else {
        await bluetoothCharacteristic.writeValue(chunk)
      }
    } else {
      throw err
    }
  }
}

async function printViaBluetooth(data) {
  if (!bluetoothCharacteristic) {
    if (bluetoothDevice) {
      await reconnectBluetooth()
    } else {
      throw new Error('Bluetooth printer not connected. Please reconnect from Settings.')
    }
  }

  const CHUNK_SIZE = 100
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE)
    await writeChunk(chunk)
    await new Promise(r => setTimeout(r, 30))
  }
}

function getBackendURL() {
  if (typeof window === 'undefined') return ''
  try {
    const stored = localStorage.getItem('serverURL')
    if (stored) return stored
  } catch { }
  return `${window.location.protocol}//${window.location.hostname}:24034`
}

async function printViaWifi(data, settings) {
  const { wifiIP, wifiPort } = settings
  if (!wifiIP) throw new Error('WiFi printer IP not configured. Go to Settings → Printer.')

  const base64 = btoa(String.fromCharCode(...data))
  const apiBase = getBackendURL()
  const res = await fetch(`${apiBase}/api/printer/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip: wifiIP, port: wifiPort || 9100, data: base64 }),
  })

  const result = await res.json()
  if (!result.success) {
    throw new Error(result.message || 'WiFi print failed. Check printer IP and connection.')
  }
  return result
}

export async function testWifiConnection(ip, port) {
  const apiBase = getBackendURL()
  const res = await fetch(`${apiBase}/api/printer/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, port: port || 9100 }),
  })
  return await res.json()
}

export async function connectWifiPrinter(ip, port = 9100) {
  if (!ip || !ip.trim()) throw new Error('Please enter the printer IP address')

  const testResult = await testWifiConnection(ip.trim(), port)
  if (!testResult.success) {
    throw new Error(testResult.message || 'Cannot reach printer. Check IP address and make sure printer is ON and on the same network.')
  }

  const settings = getPrinterSettings()
  settings.printerType = 'wifi'
  settings.printerName = `WiFi Printer (${ip.trim()}:${port})`
  settings.wifiIP = ip.trim()
  settings.wifiPort = port
  settings.printerId = `wifi-${ip.trim()}-${port}`
  savePrinterSettings(settings)

  return { success: true, name: settings.printerName }
}

export async function printReceipt(receiptData) {
  const settings = getPrinterSettings()

  if (!settings.printerType) {
    throw new Error('No printer configured. Go to Settings → Printer to set up.')
  }

  if (settings.printerType === 'bluetooth') {
    await printViaBluetooth(receiptData)
    return { success: true }
  }

  if (settings.printerType === 'wifi') {
    return await printViaWifi(receiptData, settings)
  }

  throw new Error('Unknown printer type')
}

export function removePrinter() {
  disconnectBluetoothPrinter()
  const settings = getPrinterSettings()
  settings.printerType = ''
  settings.printerName = ''
  settings.printerId = ''
  settings.wifiIP = ''
  settings.wifiPort = 9100
  savePrinterSettings(settings)
}

export function isBluetoothAvailable() {
  return !!navigator.bluetooth
}

export async function testPrint() {
  const settings = getPrinterSettings()
  const testOrder = {
    invoice_id: 'TEST-001',
    date: new Date().toISOString(),
    customer_name: 'Test Customer',
    payment_method: 'cash',
    items: [
      { name: 'Test Product 1', quantity: 2, selling_price: 100 },
      { name: 'Test Product 2', quantity: 1, selling_price: 250 },
    ],
    subtotal: 450, tax_amount: 0, discount_amount: 0, total_amount: 450, received_amount: 500,
  }
  const data = buildReceiptData(testOrder, settings)
  await printReceipt(data)
}