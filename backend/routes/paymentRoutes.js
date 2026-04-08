const express = require('express');
const router = express.Router();
const { createPaymentIntent, getPaymentIntent, createCheckoutSession, verifyCheckoutSession } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Stripe payment processing (test/sandbox mode)
 */

/**
 * @swagger
 * /api/payment/create-intent:
 *   post:
 *     summary: Create a Stripe PaymentIntent
 *     description: Creates a server-side Stripe PaymentIntent for the given amount. Returns a clientSecret for frontend confirmation and a paymentIntentId to attach to the order. Uses Stripe test mode — no real charges are made.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Order total in USD (will be converted to cents internally)
 *                 example: 149.99
 *               currency:
 *                 type: string
 *                 default: usd
 *                 example: usd
 *     responses:
 *       200:
 *         description: PaymentIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe clientSecret for frontend card confirmation
 *                   example: pi_3abc123_secret_xyz
 *                 paymentIntentId:
 *                   type: string
 *                   description: Stripe PaymentIntent ID to store with the order
 *                   example: pi_3abc123def456
 *                 demo:
 *                   type: boolean
 *                   description: Present and true when running without real Stripe keys (development fallback)
 *       400:
 *         description: Invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid amount
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Stripe API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Payment processing unavailable. Please try again.
 */
router.post('/create-intent', protect, createPaymentIntent);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/verify-session/:sessionId', protect, verifyCheckoutSession);

/**
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     summary: Retrieve a PaymentIntent by ID
 *     description: Fetches the current status of a Stripe PaymentIntent. Useful for confirming whether payment was successful after checkout.
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe PaymentIntent ID (e.g., pi_3abc123def456)
 *         example: pi_3abc123def456
 *     responses:
 *       200:
 *         description: PaymentIntent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentIntent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [requires_payment_method, requires_confirmation, processing, succeeded, canceled]
 *                     amount:
 *                       type: integer
 *                       description: Amount in cents
 *                     currency:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Stripe API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, getPaymentIntent);

module.exports = router;
