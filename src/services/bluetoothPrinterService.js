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

  // Helper untuk membuat line dengan panjang yang tepat
  createLine(char = '-', length = 32) {
    return char.repeat(length);
  }

  // Helper untuk format line dengan label dan value rata kanan
  formatLineRightAlign(label, value, totalWidth = 32) {
    const spaces = totalWidth - label.length - value.length;
    if (spaces < 1) {
      // Jika tidak muat, potong label
      const maxLabelLength = totalWidth - value.length - 1;
      return label.substring(0, maxLabelLength) + ' ' + value;
    }
    return label + ' '.repeat(spaces) + value;
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
      
      bytes.push(...this.textToBytes(`No: ${data.transactionNo}`));
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
      bytes.push(...this.textToBytes('Item            Qty       Harga'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items
      data.items.forEach(item => {
        // Baris pertama: Nama item
        let itemName = item.name;
        if (itemName.length > 32) {
          itemName = itemName.substring(0, 29) + '...';
        }
        bytes.push(...this.textToBytes(itemName));
        bytes.push(...cmd.LINE_FEED);
        
        // Baris kedua: Qty dan Harga
        const qtyStr = String(item.qty);
        const priceValue = item.price * item.qty;
        const priceStr = formatCurrency(priceValue);
        
        // Format: "  2" (qty di kiri) + spaces + harga (di kanan)
        const qtySection = '  ' + qtyStr;
        const totalWidth = 32;
        const spacesNeeded = totalWidth - qtySection.length - priceStr.length;
        const line = qtySection + ' '.repeat(Math.max(1, spacesNeeded)) + priceStr;
        
        bytes.push(...this.textToBytes(line));
        bytes.push(...cmd.LINE_FEED);
      });

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Subtotal
      const subtotalLabel = 'Subtotal:';
      const subtotalValue = formatCurrency(data.subtotal);
      const subtotalSpaces = 32 - subtotalLabel.length - subtotalValue.length;
      const subtotalLine = subtotalLabel + ' '.repeat(Math.max(1, subtotalSpaces)) + subtotalValue;
      bytes.push(...this.textToBytes(subtotalLine));
      bytes.push(...cmd.LINE_FEED);

      // Shipping Cost
      if (data.shippingCost > 0) {
        const shippingLabel = 'Ongkir:';
        const shippingValue = formatCurrency(data.shippingCost);
        const shippingSpaces = 32 - shippingLabel.length - shippingValue.length;
        const shippingLine = shippingLabel + ' '.repeat(Math.max(1, shippingSpaces)) + shippingValue;
        bytes.push(...this.textToBytes(shippingLine));
        bytes.push(...cmd.LINE_FEED);
      }

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Grand Total (Bold & Larger)
      bytes.push(...cmd.BOLD_ON);
      bytes.push(...cmd.TEXT_2X_HEIGHT);
      const totalLabel = 'TOTAL:';
      const totalValue = formatCurrency(data.grandTotal);
      const totalSpaces = 32 - totalLabel.length - totalValue.length;
      const totalLine = totalLabel + ' '.repeat(Math.max(1, totalSpaces)) + totalValue;
      bytes.push(...this.textToBytes(totalLine));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.TEXT_NORMAL);
      bytes.push(...cmd.BOLD_OFF);

      bytes.push(...this.textToBytes(this.createLine('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Payment Info
      const paidLabel = 'BAYAR:';
      const paidValue = formatCurrency(data.paid);
      const paidSpaces = 32 - paidLabel.length - paidValue.length;
      const paidLine = paidLabel + ' '.repeat(Math.max(1, paidSpaces)) + paidValue;
      bytes.push(...this.textToBytes(paidLine));
      bytes.push(...cmd.LINE_FEED);

      const changeLabel = 'KEMBALI:';
      const changeValue = formatCurrency(data.change);
      const changeSpaces = 32 - changeLabel.length - changeValue.length;
      const changeLine = changeLabel + ' '.repeat(Math.max(1, changeSpaces)) + changeValue;
      bytes.push(...this.textToBytes(changeLine));
      bytes.push(...cmd.LINE_FEED);

      bytes.push(...this.textToBytes(this.createLine('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Footer
      bytes.push(...cmd.ALIGN_CENTER);
      
      // Phone number (added here, above feedback)
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