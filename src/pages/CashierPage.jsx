import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { CartItem } from '../components/CartItem';
import { PaymentSection } from '../components/PaymentSection';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';


export function CashierPage({ printerService, printerConnected, onShowToast }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await productService.getActive();
      setProducts(data);
    } catch (error) {
      handleError(error, 'Gagal memuat produk', onShowToast);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);


  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const shipping = Number(shippingCost) || 0;
        return subtotal + shipping;
    };


    const processPayment = async () => {
        const subtotal = calculateSubtotal();
        const grandTotal = calculateGrandTotal();
        const paidAmount = parseInt(paid) || 0;

        if (paidAmount < grandTotal) {
            onShowToast('Uang bayar kurang!', 'error');
            return;
        }

        const change = paidAmount - grandTotal;

        if (
            isNaN(subtotal) ||
            isNaN(grandTotal) ||
            isNaN(paidAmount) ||
            isNaN(change)
            ) {
            onShowToast('Data pembayaran tidak valid', 'error');
            return;
        }

        console.log({
        subtotal,
        shippingCost,
        grandTotal,
        paidAmount,
        change
        });

        // const transactionNo = `TRX${Date.now()}`;

        setLoading(true);

        try {
            // ✅ SIMPAN TRANSAKSI (HEADER)
            const trx = await transactionService.create({
                total: subtotal,
                shipping_cost: shippingCost,
                grand_total: grandTotal,
                paid: paidAmount,
                change,
                items: cart
            });

            // const transactionId = trx.id; // ✅ AMAN SEKARANG


            // ✅ SIMPAN ITEM TRANSAKSI
            // await transactionService.createItems(
            // cart.map(item => ({
            //     transaction_id: transactionId, // ⬅️ FIX
            //     product_name: item.name,
            //     price: item.price,
            //     qty: item.qty,
            //     subtotal: item.price * item.qty
            // }))
            // );

            // PRINT DATA
            const printData = {
            transactionNo: trx.transaction_no,
            items: cart,
            subtotal,
            shippingCost,
            grandTotal,
            paid: paidAmount,
            change
            };

            let printed = false;

            if (printerConnected) {
            try {
                await printerService.print(printData);
                printed = true;
            } catch {
                console.warn('Bluetooth print failed, fallback');
            }
            }

            if (!printed) {
            printFallback(printData);
            }

            // RESET
            setCart([]);
            setPaid('');
            setShippingCost(0);

            onShowToast(
            `Pembayaran berhasil! Kembalian: ${formatCurrency(change)}`,
            'success'
            );
        } catch (error) {
            handleError(error, 'Gagal memproses transaksi', onShowToast);
        } finally {
            setLoading(false);
        }
    };

  const printFallback = (data) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    const itemsHtml = data.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td align="right">${item.qty}x</td>
        <td align="right">${formatCurrency(item.price * item.qty)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota - ${data.transactionNo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 20px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">BAKE BLISS</div>
          <div class="center">Jl. Ahmad Yani No. 24A</div>
          <div class="center">Magelang</div>
          <div class="line"></div>
          <div>No: ${data.transactionNo}</div>
          <div>${new Date().toLocaleString('id-ID')}</div>
          <div class="line"></div>
          <table>${itemsHtml}</table>
          <div class="line"></div>
          <table>
            <tr>
              <td>Subtotal:</td>
              <td align="right">${formatCurrency(data.subtotal)}</td>
            </tr>
            ${data.shippingCost > 0 ? `
            <tr>
              <td>Ongkir:</td>
              <td align="right">${formatCurrency(data.shippingCost)}</td>
            </tr>
            ` : ''}
            <tr class="bold">
              <td>TOTAL:</td>
              <td align="right">${formatCurrency(data.grandTotal)}</td>
            </tr>
            <tr>
              <td>BAYAR:</td>
              <td align="right">${formatCurrency(data.paid)}</td>
            </tr>
            <tr>
              <td>KEMBALI:</td>
              <td align="right">${formatCurrency(data.change)}</td>
            </tr>
          </table>
          <div class="line"></div>
          <div class="center">0881-0124-64949</div>
          <div class="center">We love to hear your feedback (the sweet and the bitter one😋)</div>
          <br>
          <div class="center">Thank you!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const subtotal = calculateSubtotal();
  const grandTotal = calculateGrandTotal();
  const paidAmount = parseInt(paid) || 0;
  const change = paidAmount >= grandTotal ? paidAmount - grandTotal : 0;

  return (
    <>
      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {products.map(product => (
          <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-white
                    p-4 rounded-lg
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    active:bg-gray-200 dark:active:bg-gray-600
                    transition-colors
                    border border-gray-200 dark:border-gray-700
                  "
                >
              <div className="font-semibold text-sm mb-1">
                {product.name}
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-xs">
                {formatCurrency(product.price)}
              </div>
          </button>

        ))}
      </div>

      {/* Cart */}
      <div className="
          bg-white dark:bg-gray-800
          rounded-lg p-4 mb-4
          border border-gray-200 dark:border-gray-700
        ">
        <h2 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
          <ShoppingCart size={18} />
          Keranjang ({cart.length})
        </h2>
        
        {cart.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Belum ada item</p>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQty={updateQty}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment */}
      {cart.length > 0 && (
        <PaymentSection
          subtotal={subtotal}
          shippingCost={shippingCost}
          onShippingCostChange={setShippingCost}
          grandTotal={grandTotal}
          paid={paid}
          onPaidChange={setPaid}
          change={change}
          onPayment={processPayment}
          loading={loading}
        />
      )}
    </>
  );
}