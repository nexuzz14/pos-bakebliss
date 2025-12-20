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
      BOLD_ON: [0x1B, 0x45, 0x01],
      BOLD_OFF: [0x1B, 0x45, 0x00],
      TEXT_NORMAL: [0x1D, 0x21, 0x00],
      TEXT_2X: [0x1D, 0x21, 0x11],
      LINE_FEED: [0x0A],
      CUT_PAPER: [0x1D, 0x56, 0x00],
    };
  }

  textToBytes(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  cleanCurrency(value) {
    try {
      const numValue = Number(value);
      if (isNaN(numValue)) return 'Rp0';
      
      const absValue = Math.abs(numValue);
      const strValue = String(Math.floor(absValue));
      
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
      console.log('=== STARTING PRINT ===');
      console.log('Data:', JSON.stringify(data));

      // Initialize
      bytes.push(...cmd.INIT);

      // Header
      bytes.push(...cmd.ALIGN_CENTER);
      bytes.push(...cmd.TEXT_2X);
      bytes.push(...cmd.BOLD_ON);
      bytes.push(...this.textToBytes(STORE_INFO.name));
      bytes.push(...cmd.LINE_FEED);
      
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

      // Items Header - FIX: Header terlalu panjang!
      const itemHeader = 'Item            Qty       Harga';
      console.log('Item header length:', itemHeader.length); // Check length
      
      bytes.push(...this.textToBytes(itemHeader));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items - Each item in ONE line
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        console.log('Processing', data.items.length, 'items');
        
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          
          console.log(`\nItem ${i}:`, item.name, 'Qty:', item.qty, 'Price:', item.price);
          
          // Item name (max 16 chars to fit with qty and price)
          let name = String(item.name || item.product_name || 'Item').trim();
          if (name.length > 16) {
            name = name.substring(0, 13) + '...';
          } else {
            name = name.padEnd(16, ' '); // Pad to 16 chars
          }
          
          // Qty and price
          const qty = parseInt(item.qty) || 1;
          const price = parseFloat(item.price) || 0;
          const total = qty * price;
          
          const qtyText = String(qty).padStart(3, ' '); // Qty in 3 chars
          const priceText = this.cleanCurrency(total);
          
          // Calculate remaining space for price (right aligned)
          // Format: name(16) + qty(3) + spaces + price(right)
          const usedSpace = 16 + 3;
          const remainingSpace = 32 - usedSpace - priceText.length;
          const spaces = remainingSpace > 0 ? ' '.repeat(remainingSpace) : ' ';
          
          const itemLine = name + qtyText + spaces + priceText;
          console.log(`Item line: "${itemLine}" (${itemLine.length} chars)`);
          
          bytes.push(...this.textToBytes(itemLine));
          bytes.push(...cmd.LINE_FEED);
          
          console.log(`Item ${i} done, bytes so far:`, bytes.length);
        }
      }

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Subtotal
      const subtotal = parseFloat(data.subtotal) || 0;
      const subtotalStr = this.cleanCurrency(subtotal);
      const subtotalLabel = 'Subtotal:';
      const subtotalSpaces = Math.max(1, 32 - subtotalLabel.length - subtotalStr.length);
      bytes.push(...this.textToBytes(subtotalLabel + ' '.repeat(subtotalSpaces) + subtotalStr));
      bytes.push(...cmd.LINE_FEED);

      // Shipping
      const shipping = parseFloat(data.shippingCost) || 0;
      if (shipping > 0) {
        const shippingStr = this.cleanCurrency(shipping);
        const shippingLabel = 'Ongkir:';
        const shippingSpaces = Math.max(1, 32 - shippingLabel.length - shippingStr.length);
        bytes.push(...this.textToBytes(shippingLabel + ' '.repeat(shippingSpaces) + shippingStr));
        bytes.push(...cmd.LINE_FEED);
      }

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Total
      bytes.push(...cmd.BOLD_ON);
      const grandTotal = parseFloat(data.grandTotal) || 0;
      const totalStr = this.cleanCurrency(grandTotal);
      const totalLabel = 'TOTAL:';
      const totalSpaces = Math.max(1, 32 - totalLabel.length - totalStr.length);
      bytes.push(...this.textToBytes(totalLabel + ' '.repeat(totalSpaces) + totalStr));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.BOLD_OFF);

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Payment
      const paid = parseFloat(data.paid || data.paidAmount) || 0;
      let change = parseFloat(data.change) || 0;
      if (!data.change || change === 0) {
        change = paid - grandTotal;
      }

      const paidStr = this.cleanCurrency(paid);
      const paidLabel = 'BAYAR:';
      const paidSpaces = Math.max(1, 32 - paidLabel.length - paidStr.length);
      bytes.push(...this.textToBytes(paidLabel + ' '.repeat(paidSpaces) + paidStr));
      bytes.push(...cmd.LINE_FEED);

      const changeStr = this.cleanCurrency(change);
      const changeLabel = 'KEMBALI:';
      const changeSpaces = Math.max(1, 32 - changeLabel.length - changeStr.length);
      bytes.push(...this.textToBytes(changeLabel + ' '.repeat(changeSpaces) + changeStr));
      bytes.push(...cmd.LINE_FEED);

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Footer
      bytes.push(...cmd.ALIGN_CENTER);
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

      // Cut
      bytes.push(...cmd.CUT_PAPER);

      console.log('Total bytes:', bytes.length);
      console.log('Sending to printer...');

      // Send header first (up to items)
      const headerEndIndex = bytes.length;
      
      // Send in smaller chunks with longer delays
      const chunkSize = 128; // Smaller chunks
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        console.log(`Sending chunk ${Math.floor(i/chunkSize) + 1}, bytes ${i}-${i+chunk.length}`);
        await this.characteristic.writeValue(new Uint8Array(chunk));
        await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay
      }

      console.log('Print completed');
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