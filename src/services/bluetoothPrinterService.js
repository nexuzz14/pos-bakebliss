import { BLUETOOTH_SERVICE_UUID, BLUETOOTH_CHARACTERISTIC_UUID, STORE_INFO } from '../utils/constants';
import { formatCurrency } from '../utils/formatCurrency';

export class BluetoothPrinterService {
  constructor() {
    this.device = null;
    this.characteristic = null;
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

      localStorage.setItem('lastPrinterDeviceId', this.device.id);
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  async autoConnect() {
    const lastDeviceId = localStorage.getItem('lastPrinterDeviceId');
    if (!lastDeviceId || !this.isSupported()) return false;

    try {
      const devices = await navigator.bluetooth.getDevices();
      this.device = devices.find(d => d.id === lastDeviceId);
      
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
      TEXT_NORMAL: [0x1B, 0x21, 0x00],
      TEXT_2X: [0x1B, 0x21, 0x30],
      LINE_FEED: [0x0A],
      CUT_PAPER: [0x1D, 0x56, 0x00]
    };
  }

  textToBytes(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  async print(data) {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const cmd = this.getESCPOS();
    let bytes = [];

    // Header
    bytes.push(...cmd.INIT);
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
    bytes.push(...this.textToBytes(`No: ${data.transactionNo}`));
    bytes.push(...cmd.LINE_FEED);
    bytes.push(...this.textToBytes(new Date().toLocaleString('id-ID')));
    bytes.push(...cmd.LINE_FEED);
    bytes.push(...this.textToBytes('--------------------------------'));
    bytes.push(...cmd.LINE_FEED);

    // Items
    data.items.forEach(item => {
      const name = item.name.padEnd(18, ' ');
      const qty = String(item.qty).padStart(2, ' ');
      const price = formatCurrency(item.price * item.qty).padStart(10, ' ');
      bytes.push(...this.textToBytes(`${name}${qty}${price}`));
      bytes.push(...cmd.LINE_FEED);
    });

    bytes.push(...this.textToBytes('--------------------------------'));
    bytes.push(...cmd.LINE_FEED);

    // Subtotal
    const subtotalLine = `Subtotal:${formatCurrency(data.subtotal).padStart(22, ' ')}`;
    bytes.push(...this.textToBytes(subtotalLine));
    bytes.push(...cmd.LINE_FEED);

    // Shipping Cost
    if (data.shippingCost > 0) {
      const shippingLine = `Ongkir:${formatCurrency(data.shippingCost).padStart(24, ' ')}`;
      bytes.push(...this.textToBytes(shippingLine));
      bytes.push(...cmd.LINE_FEED);
    }

    bytes.push(...this.textToBytes('--------------------------------'));
    bytes.push(...cmd.LINE_FEED);

    // Grand Total
    bytes.push(...cmd.BOLD_ON);
    const totalLine = `TOTAL:${formatCurrency(data.grandTotal).padStart(24, ' ')}`;
    bytes.push(...this.textToBytes(totalLine));
    bytes.push(...cmd.LINE_FEED);
    bytes.push(...cmd.BOLD_OFF);

    const paidLine = `BAYAR:${formatCurrency(data.paid).padStart(24, ' ')}`;
    bytes.push(...this.textToBytes(paidLine));
    bytes.push(...cmd.LINE_FEED);

    const changeLine = `KEMBALI:${formatCurrency(data.change).padStart(22, ' ')}`;
    bytes.push(...this.textToBytes(changeLine));
    bytes.push(...cmd.LINE_FEED);

    bytes.push(...this.textToBytes('--------------------------------'));
    bytes.push(...cmd.LINE_FEED);
    bytes.push(...cmd.LINE_FEED);

    // Footer
    bytes.push(...cmd.ALIGN_CENTER);

    bytes.push(...this.textToBytes('0881-0124-64949'));
    bytes.push(...cmd.LINE_FEED);

    bytes.push(
      ...this.textToBytes(
        'We love to hear your feedback (the sweet and the bitter one 😋)'
      )
    );
    bytes.push(...cmd.LINE_FEED);

    // 🔹 spasi kosong (setara <br>)
    bytes.push(...cmd.LINE_FEED);

    bytes.push(...this.textToBytes('Thank you!'));
    bytes.push(...cmd.LINE_FEED);

    // extra feed biar nota rapi sebelum cut
    bytes.push(...cmd.LINE_FEED);
    bytes.push(...cmd.LINE_FEED);

    // Cut paper
    bytes.push(...cmd.CUT_PAPER);

    // Send to printer
    const chunkSize = 512;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      await this.characteristic.writeValue(new Uint8Array(chunk));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }
}