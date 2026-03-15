import api from './api'

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
  showCustomerName: true,
  showDueAmount: true,
  showPaymentMethod: true,
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

export async function fetchPrinterSettings() {
  try {
    const res = await api.get('/api/printer/settings')
    const data = res.data
    if (data.success && data.settings) {
      const local = getPrinterSettings()
      const merged = {
        ...local,
        headerLine1: data.settings.headerLine1,
        headerLine2: data.settings.headerLine2,
        headerLine3: data.settings.headerLine3,
        footerLine1: data.settings.footerLine1,
        footerLine2: data.settings.footerLine2,
        paperWidth: data.settings.paperWidth,
        showCustomerName: data.settings.showCustomerName,
        showDueAmount: data.settings.showDueAmount,
        showPaymentMethod: data.settings.showPaymentMethod,
      }
      savePrinterSettings(merged)
      return merged
    }
  } catch (err) {
    console.error('[Printer] Failed to fetch settings from API:', err)
  }
  return getPrinterSettings()
}

export async function savePrinterSettingsToDb(settings) {
  try {
    await api.put('/api/printer/settings', {
      headerLine1: settings.headerLine1 || '',
      headerLine2: settings.headerLine2 || '',
      headerLine3: settings.headerLine3 || '',
      footerLine1: settings.footerLine1 || '',
      footerLine2: settings.footerLine2 || '',
      paperWidth: settings.paperWidth || 32,
      showCustomerName: settings.showCustomerName,
      showDueAmount: settings.showDueAmount,
      showPaymentMethod: settings.showPaymentMethod,
    })
    return true
  } catch (err) {
    console.error('[Printer] Failed to save settings to DB:', err)
    return false
  }
}

export function isPrinterConfigured() {
  const s = getPrinterSettings()
  if (s.printerType === 'wifi') return !!(s.wifiIP && s.wifiPort)
  if (s.printerType === 'bluetooth') return !!s.printerName
  if (s.printerType === 'usb') return !!s.printerId
  return false
}


function textToBytes(text) {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(text))
}

function repeatChar(char, count) {
  return char.repeat(count)
}

function printWidth(str) {
  let w = 0
  for (const ch of String(str)) {
    const code = ch.codePointAt(0)
    if (code > 0x7F) w += 4
    else w += 1
  }
  return w
}

function truncateToPrintWidth(str, maxWidth) {
  let w = 0
  let result = ''
  for (const ch of String(str)) {
    const code = ch.codePointAt(0)
    const cw = code > 0x7F ? 2 : 1
    if (w + cw > maxWidth) break
    result += ch
    w += cw
  }
  return result
}

function padText(text, width, align = 'left') {
  const str = truncateToPrintWidth(String(text), width)
  const pw = printWidth(str)
  const gap = width - pw
  if (align === 'right') return ' '.repeat(Math.max(0, gap)) + str
  if (align === 'center') {
    const pad = Math.floor(gap / 2)
    return ' '.repeat(Math.max(0, pad)) + str + ' '.repeat(Math.max(0, gap - pad))
  }
  return str + ' '.repeat(Math.max(0, gap))
}

function twoColumns(left, right, width) {
  const rightPW = printWidth(right)
  const leftMax = Math.max(1, width - rightPW - 1)
  return padText(left, leftMax) + ' ' + padText(right, rightPW, 'right')
}

const WEIGHT_UNITS = ['kg', 'g', 'gram', 'grams', 'ml', 'ltr', 'l', 'litre', 'liter']
function isWeightUnit(unit) {
  return WEIGHT_UNITS.includes((unit || '').toLowerCase())
}
function isVolumeUnit(unit) {
  return ['ml', 'ltr', 'l', 'litre', 'liter'].includes((unit || '').toLowerCase())
}

export function buildReceiptData(order, settings) {
  const w = settings.paperWidth || 32
  let data = []

  data.push(...COMMANDS.INIT)

  data.push(...COMMANDS.ALIGN_CENTER)
  if (settings.headerLine1) {
    data.push(...COMMANDS.BOLD_ON)
    data.push(...textToBytes(settings.headerLine1), ...COMMANDS.FEED_LINE)
    data.push(...COMMANDS.BOLD_OFF)
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
    const invText = order.invoice_id
    if (order.date) {
      const raw = String(order.date).trim()
      const d = new Date(raw.includes('T') || raw.includes('Z') || raw.includes('+') ? raw : raw + ' UTC')
      const dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      data.push(...textToBytes(twoColumns(invText, dateStr, w)), ...COMMANDS.FEED_LINE)
    } else {
      data.push(...textToBytes(invText), ...COMMANDS.FEED_LINE)
    }
  }

  if (settings.showCustomerName !== false && order.customer_name && order.customer_name !== 'Walk-in Customer') {
    data.push(...textToBytes(`Customer: ${order.customer_name}`), ...COMMANDS.FEED_LINE)
  }

  if (settings.showPaymentMethod !== false && order.payment_method) {
    data.push(...textToBytes(`Payment: ${order.payment_method.toUpperCase()}`), ...COMMANDS.FEED_LINE)
  }

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  const snW = 3
  const amtW = 8
  const itemW = w - snW - amtW - 2
  data.push(...COMMANDS.BOLD_ON)
  data.push(...textToBytes(padText('#', snW) + ' ' + padText('Item', itemW) + ' ' + padText('Amt', amtW, 'right')))
  data.push(...COMMANDS.FEED_LINE, ...COMMANDS.BOLD_OFF)
  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  const items = order.items || []
  items.forEach((item, index) => {
    const sn = String(index + 1)
    const name = truncateToPrintWidth(item.name || item.product_name || '', itemW)
    const totalAmt = `Rs.${(item.selling_price * item.quantity).toFixed(0)}`

    data.push(...textToBytes(padText(sn, snW) + ' ' + padText(name, itemW) + ' ' + padText(totalAmt, amtW, 'right')))
    data.push(...COMMANDS.FEED_LINE)

    let detailLine = ''
    if (item.is_weight && item.unit) {
      const qtyDisplay = Math.round(item.quantity * 1000)
      const displayUnit = isVolumeUnit(item.unit) ? 'ml' : 'g'
      const priceUnit = isVolumeUnit(item.unit) ? '500ml' : '500g'
      const unitPrice = item.price_per_500 || (item.selling_price / 2)
      detailLine = `${qtyDisplay}${displayUnit} x Rs.${Math.round(unitPrice)}/${priceUnit}`
    } else {
      detailLine = `${item.quantity} x Rs.${item.selling_price}`
    }
    data.push(...textToBytes('   ' + detailLine))
    data.push(...COMMANDS.FEED_LINE)
  })

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

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

  data.push(...COMMANDS.BOLD_ON)
  data.push(...textToBytes(twoColumns('TOTAL', `Rs.${Number(order.total_amount || 0).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
  data.push(...COMMANDS.BOLD_OFF)

  if (settings.showDueAmount !== false && order.received_amount !== undefined && order.received_amount !== null) {
    data.push(...textToBytes(twoColumns('Received', `Rs.${Number(order.received_amount).toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
    const due = Number(order.total_amount) - Number(order.received_amount)
    if (due > 0) {
      data.push(...textToBytes(twoColumns('Due', `Rs.${due.toFixed(2)}`, w)), ...COMMANDS.FEED_LINE)
    }
  }

  data.push(...textToBytes(repeatChar('-', w)), ...COMMANDS.FEED_LINE)

  data.push(...COMMANDS.ALIGN_CENTER)
  if (settings.footerLine1) data.push(...textToBytes(settings.footerLine1), ...COMMANDS.FEED_LINE)
  if (settings.footerLine2) data.push(...textToBytes(settings.footerLine2), ...COMMANDS.FEED_LINE)

  data.push(...textToBytes('Powered by showa.online'), ...COMMANDS.FEED_LINE)

  data.push(...COMMANDS.FEED_LINES(3), ...COMMANDS.CUT_PAPER)

  return new Uint8Array(data)
}

export function buildCartReceiptData({ cart, subtotal, taxTotal, discount, total, received, dueAmount, customerName, paymentMode, invoiceId, totalItems, totalQty }, settings) {
  return buildReceiptData({
    invoice_id: invoiceId || '',
    date: new Date().toISOString(),
    customer_name: customerName || 'Walk-in Customer',
    payment_method: paymentMode,
    items: cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      selling_price: item.selling_price,
      is_weight: item.is_weight || false,
      unit: item.unit || 'pcs',
      price_per_500: item.price_per_500 || 0,
    })),
    subtotal, tax_amount: taxTotal, discount_amount: discount, total_amount: total, received_amount: received,
    total_items: totalItems || cart.length,
    total_qty: totalQty || cart.reduce((s, i) => s + i.quantity, 0),
  }, settings)
}


let bluetoothDevice = null
let bluetoothCharacteristic = null

const BT_KNOWN_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
]

const BT_KNOWN_WRITE_CHARS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '49535343-1e4d-4bd9-ba61-23c647249616',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000af01-0000-1000-8000-00805f9b34fb',
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


let usbDevice = null
let usbEndpoint = null

export function isUsbAvailable() {
  return !!navigator.usb
}

async function getPairedUsbPrinter() {
  if (!navigator.usb) return null
  try {
    const devices = await navigator.usb.getDevices()
    const printer = devices.find(d =>
      d.configuration?.interfaces?.some(iface =>
        iface.alternates?.some(alt => alt.interfaceClass === 7)
      )
    )
    return printer || (devices.length > 0 ? devices[0] : null)
  } catch { return null }
}

export async function pairUsbPrinter() {
  if (!navigator.usb) {
    throw new Error('WebUSB not supported. Use Chrome or Edge browser.')
  }
  try {
    const device = await navigator.usb.requestDevice({
      filters: [{ classCode: 7 }] 
    })
    await openUsbDevice(device)
    const settings = getPrinterSettings()
    settings.printerType = 'usb'
    settings.printerName = device.productName || 'USB Printer'
    settings.printerId = `usb-${device.vendorId}-${device.productId}`
    savePrinterSettings(settings)
    return { success: true, name: settings.printerName }
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('No printer selected. Please select your USB printer from the list.')
    }
    throw err
  }
}

async function openUsbDevice(device) {
  try {
    await device.open()
  } catch (err) {
    if (!err.message?.includes('already open')) throw err
  }

  if (!device.configuration) {
    await device.selectConfiguration(1)
  }

  let printerInterface = null
  let outEndpoint = null

  for (const iface of device.configuration.interfaces) {
    for (const alt of iface.alternates) {
      if (alt.interfaceClass === 7) {
        printerInterface = iface
        outEndpoint = alt.endpoints.find(ep => ep.direction === 'out' && ep.type === 'bulk')
        break
      }
    }
    if (outEndpoint) break
  }

  if (!outEndpoint) {
    for (const iface of device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        const ep = alt.endpoints.find(ep => ep.direction === 'out')
        if (ep) {
          printerInterface = iface
          outEndpoint = ep
          break
        }
      }
      if (outEndpoint) break
    }
  }

  if (!printerInterface || !outEndpoint) {
    throw new Error('Could not find a writable endpoint on this USB device.')
  }

  try {
    await device.claimInterface(printerInterface.interfaceNumber)
  } catch (err) {
    if (!err.message?.includes('already claimed')) throw err
  }

  usbDevice = device
  usbEndpoint = outEndpoint
}

async function ensureUsbConnected() {
  if (usbDevice && usbDevice.opened && usbEndpoint) return true

  const device = await getPairedUsbPrinter()
  if (!device) return false

  try {
    await openUsbDevice(device)
    return true
  } catch {
    usbDevice = null
    usbEndpoint = null
    return false
  }
}

async function printViaUsb(data) {
  if (!usbDevice || !usbDevice.opened || !usbEndpoint) {
    throw new Error('USB printer not connected.')
  }

  const CHUNK = 4096
  for (let i = 0; i < data.length; i += CHUNK) {
    const chunk = data.slice(i, i + CHUNK)
    await usbDevice.transferOut(usbEndpoint.endpointNumber, chunk)
  }
  return { success: true }
}

export function disconnectUsbPrinter() {
  if (usbDevice && usbDevice.opened) {
    try { usbDevice.close() } catch {}
  }
  usbDevice = null
  usbEndpoint = null
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

export async function checkPrinterConnected() {
  const settings = getPrinterSettings()

  if (!settings.printerType || settings.printerType === 'usb') {
    const usbOk = await ensureUsbConnected()
    if (usbOk) return true
    if (settings.printerType === 'usb') {
      throw new Error('USB printer not found. Make sure it is connected and turned on.\nIf this is first time, go to Settings → Printer and click "Pair USB Printer".')
    }
    if (!settings.printerType) {
      throw new Error('No printer configured. Go to Settings → Printer to set up.')
    }
  }

  if (settings.printerType === 'bluetooth') {
    if (!bluetoothCharacteristic && !bluetoothDevice) {
      throw new Error('Bluetooth printer not connected. Please reconnect from Settings.')
    }
    return true
  }

  if (settings.printerType === 'wifi') {
    const result = await testWifiConnection(settings.wifiIP, settings.wifiPort)
    if (!result.success) {
      throw new Error(result.message || 'WiFi printer not reachable. Check printer IP and make sure printer is ON.')
    }
    return true
  }

  throw new Error('Unknown printer type')
}

export async function printReceipt(receiptData) {
  const settings = getPrinterSettings()

  if (!settings.printerType || settings.printerType === 'usb') {
    const usbOk = await ensureUsbConnected()
    if (usbOk) {
      return await printViaUsb(receiptData)
    }
    if (settings.printerType === 'usb') {
      throw new Error('USB printer not found. Make sure it is connected and turned on.')
    }
    if (!settings.printerType) {
      throw new Error('No printer configured. Go to Settings → Printer to set up.')
    }
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
  disconnectUsbPrinter()
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
      { name: 'Dahi 500g Pack', quantity: 0.5, selling_price: 60, is_weight: true, unit: 'kg', price_per_500: 30 },
    ],
    subtotal: 260, tax_amount: 0, discount_amount: 0, total_amount: 260, received_amount: 300,
  }
  const data = buildReceiptData(testOrder, settings)
  await printReceipt(data)
}