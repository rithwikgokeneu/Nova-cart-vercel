const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Save and manage favourite products — requires authentication
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get the current user's wishlist
 *     description: Returns the authenticated user's wishlist with fully populated product details (title, price, images, stock, category).
 *     tags: [Wishlist]
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
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
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   post:
 *     summary: Toggle a product in the wishlist (add or remove)
 *     description: |
 *       If the product is already in the wishlist it is removed; if it is not present it is added.
 *       This single endpoint handles both add and remove to keep the client simple.
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product to toggle
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: Wishlist updated — returns new state and count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 inWishlist:
 *                   type: boolean
 *                   description: true if the product was just added, false if it was removed
 *                   example: true
 *                 wishlistCount:
 *                   type: integer
 *                   description: Total number of products currently in the wishlist
 *                   example: 4
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:productId', protect, toggleWishlist);

module.exports = router;
