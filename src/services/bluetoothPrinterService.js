import { BLUETOOTH_SERVICE_UUID, BLUETOOTH_CHARACTERISTIC_UUID, STORE_INFO } from '../utils/constants';
import { formatCurrency } from '../utils/formatCurrency';

export class BluetoothPrinterService {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.lastDeviceId = null; // Store in memory instead of localStorage
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

      // Store device ID in memory
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
      // Initialization & Control
      INIT: [0x1B, 0x40],                    // Initialize printer
      
      // Text Alignment
      ALIGN_CENTER: [0x1B, 0x61, 0x01],      // Center alignment
      ALIGN_LEFT: [0x1B, 0x61, 0x00],        // Left alignment
      ALIGN_RIGHT: [0x1B, 0x61, 0x02],       // Right alignment
      
      // Text Style
      BOLD_ON: [0x1B, 0x45, 0x01],           // Bold on
      BOLD_OFF: [0x1B, 0x45, 0x00],          // Bold off
      
      // Text Size (RPP02N compatible)
      TEXT_NORMAL: [0x1D, 0x21, 0x00],       // Normal size
      TEXT_2X_HEIGHT: [0x1D, 0x21, 0x01],    // 2x height
      TEXT_2X_WIDTH: [0x1D, 0x21, 0x10],     // 2x width
      TEXT_2X: [0x1D, 0x21, 0x11],           // 2x width & height
      
      // Line & Paper
      LINE_FEED: [0x0A],                     // Line feed
      PAPER_FEED: [0x1B, 0x64, 0x02],        // Feed paper 2 lines
      CUT_PAPER: [0x1D, 0x56, 0x00],         // Full cut
      PARTIAL_CUT: [0x1D, 0x56, 0x01],       // Partial cut
      
      // Character spacing (better for RPP02N)
      CHAR_SPACING_DEFAULT: [0x1B, 0x20, 0x00]
    };
  }

  textToBytes(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  // Helper to create separator line
  createSeparator(char = '-', length = 32) {
    return char.repeat(length);
  }

  async print(data) {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const cmd = this.getESCPOS();
    let bytes = [];

    try {
      // Initialize printer
      bytes.push(...cmd.INIT);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Header - Store Name
      bytes.push(...cmd.ALIGN_CENTER);
      bytes.push(...cmd.TEXT_2X);
      bytes.push(...cmd.BOLD_ON);
      bytes.push(...this.textToBytes(STORE_INFO.name));
      bytes.push(...cmd.LINE_FEED);
      
      // Store Info
      bytes.push(...cmd.TEXT_NORMAL);
      bytes.push(...cmd.BOLD_OFF);
      bytes.push(...this.textToBytes(STORE_INFO.address));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes('Magelang'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(STORE_INFO.phone));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Transaction Info
      bytes.push(...cmd.ALIGN_LEFT);
      bytes.push(...this.textToBytes(this.createSeparator('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(`No: ${data.transactionNo}`));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(new Date().toLocaleString('id-ID')));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(this.createSeparator('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items Header
      bytes.push(...this.textToBytes('Item                Qty   Harga'));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...this.textToBytes(this.createSeparator('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Items
      data.items.forEach(item => {
        // Item name (truncate if too long)
        const itemName = item.name.length > 20 ? 
          item.name.substring(0, 17) + '...' : 
          item.name.padEnd(20, ' ');
        
        const qty = String(item.qty).padStart(3, ' ');
        const price = formatCurrency(item.price * item.qty).padStart(9, ' ');
        
        bytes.push(...this.textToBytes(`${itemName}${qty}${price}`));
        bytes.push(...cmd.LINE_FEED);
      });

      bytes.push(...this.textToBytes(this.createSeparator('-', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Subtotal
      const subtotalLabel = 'Subtotal:';
      const subtotalValue = formatCurrency(data.subtotal);
      const subtotalSpaces = ' '.repeat(32 - subtotalLabel.length - subtotalValue.length);
      bytes.push(...this.textToBytes(`${subtotalLabel}${subtotalSpaces}${subtotalValue}`));
      bytes.push(...cmd.LINE_FEED);

      // Shipping Cost
      if (data.shippingCost > 0) {
        const shippingLabel = 'Ongkir:';
        const shippingValue = formatCurrency(data.shippingCost);
        const shippingSpaces = ' '.repeat(32 - shippingLabel.length - shippingValue.length);
        bytes.push(...this.textToBytes(`${shippingLabel}${shippingSpaces}${shippingValue}`));
        bytes.push(...cmd.LINE_FEED);
      }

      bytes.push(...this.textToBytes(this.createSeparator('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Grand Total
      bytes.push(...cmd.BOLD_ON);
      bytes.push(...cmd.TEXT_2X_HEIGHT);
      const totalLabel = 'TOTAL:';
      const totalValue = formatCurrency(data.grandTotal);
      const totalSpaces = ' '.repeat(32 - totalLabel.length - totalValue.length);
      bytes.push(...this.textToBytes(`${totalLabel}${totalSpaces}${totalValue}`));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.TEXT_NORMAL);
      bytes.push(...cmd.BOLD_OFF);

      bytes.push(...this.textToBytes(this.createSeparator('=', 32)));
      bytes.push(...cmd.LINE_FEED);

      // Payment Info
      const paidLabel = 'BAYAR:';
      const paidValue = formatCurrency(data.paid);
      const paidSpaces = ' '.repeat(32 - paidLabel.length - paidValue.length);
      bytes.push(...this.textToBytes(`${paidLabel}${paidSpaces}${paidValue}`));
      bytes.push(...cmd.LINE_FEED);

      const changeLabel = 'KEMBALI:';
      const changeValue = formatCurrency(data.change);
      const changeSpaces = ' '.repeat(32 - changeLabel.length - changeValue.length);
      bytes.push(...this.textToBytes(`${changeLabel}${changeSpaces}${changeValue}`));
      bytes.push(...cmd.LINE_FEED);

      bytes.push(...this.textToBytes(this.createSeparator('-', 32)));
      bytes.push(...cmd.LINE_FEED);
      bytes.push(...cmd.LINE_FEED);

      // Footer
      bytes.push(...cmd.ALIGN_CENTER);
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

      // Send to printer in chunks (RPP02N works better with smaller chunks)
      const chunkSize = 256; // Smaller chunk size for better compatibility
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await this.characteristic.writeValue(new Uint8Array(chunk));
        // Longer delay for RPP02N stability
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