const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Discount coupon management — validate (customer) and CRUD (admin only)
 */

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon code at checkout
 *     description: |
 *       Checks whether the supplied code is active, not expired, within usage limits, and
 *       meets the minimum order amount. Returns the calculated discount amount.
 *       Used by the Checkout page before redirecting to Stripe.
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, cartTotal]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code (case-insensitive)
 *                 example: SAVE20
 *               cartTotal:
 *                 type: number
 *                 description: Current cart subtotal in dollars
 *                 example: 89.99
 *     responses:
 *       200:
 *         description: Coupon is valid — returns discount details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: SAVE20
 *                 discountType:
 *                   type: string
 *                   enum: [percentage, fixed]
 *                   example: percentage
 *                 discountValue:
 *                   type: number
 *                   example: 20
 *                 discountAmount:
 *                   type: number
 *                   description: Dollar amount deducted from the order total
 *                   example: 18.00
 *       400:
 *         description: Coupon expired, usage limit reached, or cart below minimum order amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               expired:
 *                 value:
 *                   message: Coupon has expired
 *               limitReached:
 *                 value:
 *                   message: Coupon usage limit reached
 *               minOrder:
 *                 value:
 *                   message: Minimum order amount is $50
 *       404:
 *         description: Coupon code not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid coupon code
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/validate', protect, validateCoupon);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: List all coupons (Admin only)
 *     description: Returns all coupons sorted by creation date descending, including usage counts and expiry dates.
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, admin, getCoupons);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     description: Creates a discount coupon with either a percentage or fixed dollar amount off. The code is stored in uppercase.
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue, expiresAt]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique coupon code (stored uppercase)
 *                 example: SAVE20
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               discountValue:
 *                 type: number
 *                 description: Percentage (0–100) or fixed dollar amount
 *                 example: 20
 *               minOrderAmount:
 *                 type: number
 *                 description: Minimum cart subtotal required to apply the coupon
 *                 default: 0
 *                 example: 50
 *               maxUses:
 *                 type: integer
 *                 description: Maximum number of times this coupon can be used
 *                 default: 100
 *                 example: 10
 *               expiresAt:
 *                 type: string
 *                 format: date
 *                 description: Expiry date after which the coupon is invalid
 *                 example: "2026-12-31"
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Coupon code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Coupon code already exists
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, admin, createCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin only)
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the coupon
 *         example: 64f1a2b3c4d5e6f7a8b9c0d9
 *     responses:
 *       200:
 *         description: Coupon deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
