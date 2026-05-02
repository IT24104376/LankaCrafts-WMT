import express from 'express';
import { handlePaymentNotification, verifyPaymentNotification, createPaymentLink } from '../services/paymentService.js';
import { paymentValidation } from '../middleware/validation.js';

const router = express.Router();

// Create payment link for PayHere checkout
router.post('/create', paymentValidation, async (req, res) => {
  try {
    const { orderId, amount, currency, items, customerName, email, phone, address, city, country } = req.body;
    
    const paymentLink = createPaymentLink({
      orderId,
      amount,
      currency: currency || 'LKR',
      items: items || 'LankaCrafts Purchase',
      customerName,
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || 'Sri Lanka'
    });
    
    res.json({
      success: true,
      paymentUrl: paymentLink,
      orderId
    });
  } catch (err) {
    console.error('[PAYMENT] Create error:', err);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// PayHere payment notification callback
router.post('/notify', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { order_id, payment_status, payhere_amount, payhere_currency, merchant_id } = req.body;

    const isValid = verifyPaymentNotification(order_id, parseFloat(payhere_amount), payment_status);

    if (isValid) {
      console.log(`[PAYMENT] Order ${order_id} payment successful. Amount: ${payhere_amount} ${payhere_currency}`);
      return res.status(200).send('OK');
    }

    console.log(`[PAYMENT] Order ${order_id} payment failed or invalid.`);
    return res.status(400).send('Payment verification failed');
  } catch (err) {
    console.error('[PAYMENT] Notification error:', err);
    return res.status(500).send('Error processing payment');
  }
});

export default router;

