const express = require('express');
const router = express.Router();
const { recordView, getRecentlyViewed } = require('../controllers/recentlyViewedController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: RecentlyViewed
 *   description: Track and retrieve recently viewed products per user (capped at 10, newest first)
 */

/**
 * @swagger
 * /api/recently-viewed:
 *   get:
 *     summary: Get the current user's recently viewed products
 *     description: Returns up to 10 products the authenticated user has viewed most recently, newest first, with full product details populated.
 *     tags: [RecentlyViewed]
 *     responses:
 *       200:
 *         description: Recently viewed products retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   description: Up to 10 products, most recently viewed first
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getRecentlyViewed);

/**
 * @swagger
 * /api/recently-viewed/{productId}:
 *   post:
 *     summary: Record a product view
 *     description: |
 *       Adds the product to the user's recently viewed list. If the product was already viewed
 *       before, its entry is moved to the top (most recent). The list is capped at 10 items —
 *       the oldest entry is dropped when the limit is exceeded.
 *       Called automatically when a user visits a product detail page.
 *     tags: [RecentlyViewed]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the viewed product
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: View recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:productId', protect, recordView);

module.exports = router;
