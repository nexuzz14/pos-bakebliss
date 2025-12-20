import { BLUETOOTH_SERVICE_UUID, BLUETOOTH_CHARACTERISTIC_UUID, STORE_INFO } from '../utils/constants';
import { formatCurrency } from '../utils/formatCurrency';

export class BluetoothPrinterService {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.lastDeviceId = null;
  }

  isSupported() {
    return 'bluetooth' in navigator;
  }

  async connect() {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLUETOOTH_SERVICE_UUID] }],
        optionalServices: [BLUETOOTH_SERVICE_UUID]
      });

      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService(BLUETOOTH_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(BLUETOOTH_CHARACTERISTIC_UUID);

      this.lastDeviceId = this.device.id;
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  async autoConnect() {
    if (!this.lastDeviceId || !this.isSupported()) return false;

    try {
      const devices = await navigator.bluetooth.getDevices();
      this.device = devices.find(d => d.id === this.lastDeviceId);
      
      if (this.device) {
        const server = await this.device.gatt.connect();
        const service = await server.getPrimaryService(BLUETOOTH_SERVICE_UUID);
        this.characteristic = await service.getCharacteristic(BLUETOOTH_CHARACTERISTIC_UUID);
        return true;
      }
    } catch (error) {
      console.error('Auto-connect failed:', error);
    }
    return false;
  }

  getESCPOS() {
    return {
      INIT: [0x1B, 0x40],
      ALIGN_CENTER: [0x1B, 0x61, 0x01],
      ALIGN_LEFT: [0x1B, 0x61, 0x00],
      ALIGN_RIGHT: [0x1B, 0x61, 0x02],
      BOLD_ON: [0x1B, 0x45, 0x01],
      BOLD_OFF: [0x1B, 0x45, 0x00],
      TEXT_NORMAL: [0x1D, 0x21, 0x00],
      TEXT_2X_HEIGHT: [0x1D, 0x21, 0x01],
      TEXT_2X_WIDTH: [0x1D, 0x21, 0x10],
      TEXT_2X: [0x1D, 0x21, 0x11],
      LINE_FEED: [0x0A],
      CUT_PAPER: [0x1D, 0x56, 0x00],
    };
  }

  textToBytes(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  // Helper untuk format currency yang kompatibel dengan printer thermal
  cleanCurrency(value) {
    try {
      const numValue = Number(value);
      if (isNaN(numValue)) return 'Rp0';
      
      // Format manual tanpa locale
      const absValue = Math.abs(numValue);
      const strValue = String(Math.floor(absValue));
      
      // Tambahkan separator ribuan manual
      let formatted = '';
      let count = 0;
      for (let i = strValue.length - 1; i >= 0; i--) {
        if (count === 3) {
          formatted = '.' + formatted;
          count = 0;
        }
        formatted = strValue[i] + formatted;
        count++;
      }
      
      return 'Rp' + formatted;
    } catch (e) {
      return 'Rp0';
    }
  }

  createLine(char = '-', length = 32) {
    return char.repeat(length);
  }

  async print(data) {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const cmd = this.getESCPOS();
    let bytes = [];

    try {
      // Initialize
      bytes.push(...cmd.INIT);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Header - Store Name
      bytes.push(...cmd.ALIGN_CENTER);
      bytes.push(...cmd.TEXT_2X);
      bytes.push(...cmd.BOLD_ON);
      bytes.push(...this.textToBytes(STORE_INFO.name));
      bytes.push(...cmd.LINE_FEED);
      
      // Store Address
      bytes.push(...cmd.TEXT_NORMAL);
      bytes.push(...cmd.BOLD_OFF);
      bytes.push(...this.textToBytes(STORE_INFO.address));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes('Magelang'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Transaction Info
      bytes.push(...cmd.ALIGN_LEFT);
      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      
      bytes.push(...this.textToBytes('No: ' + data.transactionNo));
      bytes.push(...cmd.LINE_FEED);
      
      const dateStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      bytes.push(...this.textToBytes(dateStr));
      bytes.push(...cmd.LINE_FEED);
      
      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items Header
      bytes.push(...this.textToBytes('Item                Qty   Harga'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items - Simplified tanpa terlalu banyak log
      if (data.items && Array.isArray(data.items)) {
        for (let idx = 0; idx < data.items.length; idx++) {
          const item = data.items[idx];
          
          // Nama item - print langsung
          let itemName = item.name ? String(item.name) : ('Item ' + (idx + 1));
          if (itemName.length > 32) {
            itemName = itemName.substring(0, 29) + '...';
          }
          
          bytes.push(...this.textToBytes(itemName));
          bytes.push(...cmd.LINE_FEED);
          
          // Qty dan Price
          const qty = parseInt(item.qty) || 1;
          const price = parseFloat(item.price) || 0;
          const totalPrice = qty * price;
          
          // Format line: "  2                    Rp58.000"
          const qtyPart = '  ' + String(qty);
          const pricePart = this.cleanCurrency(totalPrice);
          
          // Total width = 32
          // qtyPart di kiri, pricePart di kanan
          const spacesCount = 32 - qtyPart.length - pricePart.length;
          const spaces = spacesCount > 0 ? ' '.repeat(spacesCount) : ' ';
          
          const fullLine = qtyPart + spaces + pricePart;
          
          bytes.push(...this.textToBytes(fullLine));
          bytes.push(...cmd.LINE_FEED);
        }
      }

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Subtotal
      const subtotal = parseFloat(data.subtotal) || 0;
      const subtotalStr = this.cleanCurrency(subtotal);
      const subtotalLabel = 'Subtotal:';
      const subtotalSpace = 32 - subtotalLabel.length - subtotalStr.length;
      const subtotalLine = subtotalLabel + ' '.repeat(subtotalSpace > 0 ? subtotalSpace : 1) + subtotalStr;
      bytes.push(...this.textToBytes(subtotalLine));
      bytes.push(...cmd.LINE_FEED);

      // Shipping Cost
      const shipping = parseFloat(data.shippingCost) || 0;
      if (shipping > 0) {
        const shippingStr = this.cleanCurrency(shipping);
        const shippingLabel = 'Ongkir:';
        const shippingSpace = 32 - shippingLabel.length - shippingStr.length;
        const shippingLine = shippingLabel + ' '.repeat(shippingSpace > 0 ? shippingSpace : 1) + shippingStr;
        bytes.push(...this.textToBytes(shippingLine));
        bytes.push(...cmd.LINE_FEED);
      }

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Grand Total
      bytes.push(...cmd.BOLD_ON);
      const grandTotal = parseFloat(data.grandTotal) || 0;
      const totalStr = this.cleanCurrency(grandTotal);
      const totalLabel = 'TOTAL:';
      const totalSpace = 32 - totalLabel.length - totalStr.length;
      const totalLine = totalLabel + ' '.repeat(totalSpace > 0 ? totalSpace : 1) + totalStr;
      bytes.push(...this.textToBytes(totalLine));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.BOLD_OFF);

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Payment Info - Fix field names
      const paid = parseFloat(data.paid || data.paidAmount) || 0;
      const change = parseFloat(data.change) || 0;
      
      const paidStr = this.cleanCurrency(paid);
      const paidLabel = 'BAYAR:';
      const paidSpaces = 32 - paidLabel.length - paidStr.length;
      const paidLine = paidLabel + ' '.repeat(paidSpaces > 0 ? paidSpaces : 1) + paidStr;
      
      bytes.push(...this.textToBytes(paidLine));
      bytes.push(...cmd.LINE_FEED);

      const changeStr = this.cleanCurrency(change);
      const changeLabel = 'KEMBALI:';
      const changeSpaces = 32 - changeLabel.length - changeStr.length;
      const changeLine = changeLabel + ' '.repeat(changeSpaces > 0 ? changeSpaces : 1) + changeStr;
      
      bytes.push(...this.textToBytes(changeLine));
      bytes.push(...cmd.LINE_FEED);

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Footer
      bytes.push(...cmd.ALIGN_CENTER);
      
      // Phone number
      bytes.push(...this.textToBytes(STORE_INFO.phone));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);
      
      bytes.push(...this.textToBytes('We love to hear your feedback'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes('(the sweet and the bitter one)'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      bytes.push(...cmd.BOLD_ON);
      bytes.push(...this.textToBytes('Thank you!'));
      bytes.push(...cmd.BOLD_OFF);
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Cut paper
      bytes.push(...cmd.CUT_PAPER);

      // Send to printer
      const chunkSize = 256;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await this.characteristic.writeValue(new Uint8Array(chunk));
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      return true;
    } catch (error) {
      console.error('Print failed:', error);
      throw new Error(`Print failed: ${error.message}`);
    }
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  isConnected() {
    return this.device && this.device.gatt.connected;
  }
}