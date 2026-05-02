import crypto from 'crypto';

// Use environment variables with fallbacks to empty strings
// IMPORTANT: These must be set in production!
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '';
const PAYHERE_SECRET = process.env.PAYHERE_SECRET || '';
const PAYHERE_BASE_URL = process.env.PAYHERE_MODE === 'live'
  ? 'https://www.payhere.lk/pay/checkout'
  : 'https://sandbox.payhere.lk/pay/checkout';

// Validate required environment variables
if (!PAYHERE_MERCHANT_ID || !PAYHERE_SECRET) {
  console.warn('[PAYMENT] WARNING: PAYHERE_MERCHANT_ID or PAYHERE_SECRET not configured!');
}

export function generatePaymentHash(orderId, amount, currency = 'LKR') {
  const hash = crypto.createHash('sha256');
  hash.update(PAYHERE_SECRET + orderId + amount.toFixed(2) + currency + PAYHERE_MERCHANT_ID);
  return hash.digest('hex').toUpperCase();
}

export function createPaymentLink(payment) {
  const { orderId, amount, currency = 'LKR', items, customerName, email, phone, address, city, country } = payment;

  const hash = generatePaymentHash(orderId, amount, currency);

  const params = new URLSearchParams({
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/crafts/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/crafts/payment/cancel`,
    notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/notify`,
    order_id: orderId,
    items: items,
    amount: amount.toFixed(2),
    currency: currency,
    hash: hash,
    first_name: customerName.split(' ')[0],
    last_name: customerName.split(' ').slice(1).join(' ') || '',
    email: email,
    phone: phone,
    address: address || '',
    city: city || '',
    country: country || 'Sri Lanka',
  });

  return `${PAYHERE_BASE_URL}?${params.toString()}`;
}

export function verifyPaymentNotification(orderId, amount, statusCode, hash) {
  // statusCode '2' = success, '0' = pending, '-1' = cancelled, '-2' = failed
  if (statusCode !== '2') {
    return false;
  }

  // If merchant secret is configured, verify the hash
  if (PAYHERE_SECRET) {
    // PayHere sends the hash in the notify request
    // Hash format: SHA256(secret + order_id + amount + currency + merchant_id)
    const expectedHash = crypto.createHash('sha256')
      .update(PAYHERE_SECRET + orderId + amount.toFixed(2) + 'LKR' + PAYHERE_MERCHANT_ID)
      .digest('hex').toUpperCase();
    
    if (hash && hash !== expectedHash) {
      console.warn(`[PAYMENT] Hash verification failed for order ${orderId}`);
      return false;
    }
  }

  return true;
}

export async function handlePaymentNotification(req, res) {
  const { order_id, payment_status, payhere_amount, payhere_currency, hash } = req.body || req;

  if (payment_status !== '2') {
    console.log(`[PAYMENT] Order ${order_id} payment status: ${payment_status}`);
    return { success: false, orderId: order_id, status: payment_status };
  }

  // Verify the payment
  const isValid = verifyPaymentNotification(order_id, parseFloat(payhere_amount), payment_status, hash);
  
  if (!isValid) {
    console.warn(`[PAYMENT] Invalid payment for order ${order_id}`);
    return { success: false, orderId: order_id, error: 'Invalid payment verification' };
  }

  // TODO: Update order status in database
  console.log(`[PAYMENT] Payment successful for order ${order_id}, amount: ${payhere_amount} ${payhere_currency}`);

  return { success: true, orderId: order_id, amount: payhere_amount, currency: payhere_currency };
}