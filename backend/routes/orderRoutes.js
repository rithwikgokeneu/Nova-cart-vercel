const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, getUserOrders, updateOrderStatus, cancelOrder, trackOrder, getVendorOrders, getMonthlyAnalytics, getVendorAnalytics, exportOrdersCSV, requestReplacement, requestCancellation, resolveCancellation } = require('../controllers/orderController');
const { protect, admin, vendor } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order lifecycle — create, track, update status
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from cart
 *     description: Converts the current user's cart into an order, deducts stock, and records the Stripe payment intent ID.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required: [street, city, state, zipCode, country]
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 123 Main St
 *                   city:
 *                     type: string
 *                     example: Boston
 *                   state:
 *                     type: string
 *                     example: MA
 *                   zipCode:
 *                     type: string
 *                     example: "02101"
 *                   country:
 *                     type: string
 *                     example: USA
 *               paymentIntentId:
 *                 type: string
 *                 description: Stripe PaymentIntent ID (marks order as paid)
 *                 example: pi_3abc123def456
 *               notes:
 *                 type: string
 *                 example: Please leave at door
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart is empty or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emptyCart:
 *                 value:
 *                   message: Cart is empty
 *               insufficientStock:
 *                 value:
 *                   message: Insufficient stock for Product Name
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get the current user's order history
 *     description: Returns all orders placed by the authenticated customer, sorted newest first.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: User's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-orders', protect, getUserOrders);

/**
 * @swagger
 * /api/orders/export/csv:
 *   get:
 *     summary: Export all orders as CSV (Admin only)
 *     description: Streams a CSV file containing every order with customer name, email, items, total, status, payment status, coupon code, discount amount, and order date. Downloaded directly by the browser.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "OrderID,Customer,Email,Items,Total,Status,Payment,Date\n..."
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export/csv', protect, admin, exportOrdersCSV);

/**
 * @swagger
 * /api/orders/analytics/monthly:
 *   get:
 *     summary: Get monthly revenue analytics (Admin only)
 *     description: Aggregates paid orders by year and month. Returns total revenue and order count per month, sorted chronologically. Used to power the admin revenue chart.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Monthly analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 2025
 *                           month:
 *                             type: integer
 *                             example: 11
 *                       totalRevenue:
 *                         type: number
 *                         example: 4320.50
 *                       totalOrders:
 *                         type: integer
 *                         example: 38
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics/monthly', protect, admin, getMonthlyAnalytics);

/**
 * @swagger
 * /api/orders/vendor/analytics:
 *   get:
 *     summary: Get monthly revenue analytics for the authenticated vendor
 *     description: Same aggregation as the admin monthly analytics but scoped to only the orders that contain the vendor's products. Powers the Vendor Dashboard analytics charts.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Vendor monthly analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 2025
 *                           month:
 *                             type: integer
 *                             example: 11
 *                       totalRevenue:
 *                         type: number
 *                         example: 1250.00
 *                       totalOrders:
 *                         type: integer
 *                         example: 12
 *       403:
 *         description: Vendor access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/vendor/analytics', protect, vendor, getVendorAnalytics);

/**
 * @swagger
 * /api/orders/track/{id}:
 *   get:
 *     summary: Track an order by ID (public)
 *     description: |
 *       Returns safe, public-facing order information — status, items, shipping address, and total.
 *       Payment details are never exposed. No authentication required so customers can share tracking links.
 *     tags: [Orders]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the order to track
 *         example: 64f1a2b3c4d5e6f7a8b9c0d5
 *     responses:
 *       200:
 *         description: Order tracking info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, shipped, delivered, cancelled]
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                     shippingAddress:
 *                       type: object
 *                     totalAmount:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/track/:id', trackOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel a pending order (Customer only)
 *     description: |
 *       Allows the order's owner to cancel it while it is still in **pending** status.
 *       On cancellation the stock for each item is restored via `$inc`.
 *       Orders in processing, shipped, or delivered status cannot be cancelled.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the order to cancel
 *         example: 64f1a2b3c4d5e6f7a8b9c0d5
 *     responses:
 *       200:
 *         description: Order cancelled and stock restored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Order cannot be cancelled (not in pending status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Only pending orders can be cancelled
 *       403:
 *         description: Not the order owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/replacement', protect, requestReplacement);
router.post('/:id/request-cancel', protect, requestCancellation);
router.put('/:id/resolve-cancel', protect, vendor, resolveCancellation);

/**
 * @swagger
 * /api/orders/vendor:
 *   get:
 *     summary: Get orders containing the vendor's products
 *     description: Returns all orders that include at least one product belonging to the authenticated vendor.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Vendor's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       403:
 *         description: Not a vendor or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/vendor', protect, vendor, getVendorOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     description: Paginated list of every order in the system. Supports filtering by status.
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Paginated order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, admin, getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Customers can only view their own orders. Admins can view any order.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ObjectId
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       403:
 *         description: Not authorized to view this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     description: Vendors and admins can advance an order through the status pipeline. Setting status to "delivered" automatically marks payment as paid.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not a vendor or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/status', protect, vendor, updateOrderStatus);

module.exports = router;
