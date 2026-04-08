const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI shopping assistant powered by Groq (llama3-8b-8192). Answers product questions, checks order status, and guides users through the store.
 */

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     summary: Send a message to the AI chatbot
 *     description: |
 *       Processes the user's message using intent detection and real MongoDB data injection.
 *
 *       **Intent types detected:**
 *       - `products` — searches the product catalog and returns matching items with prices
 *       - `orders` — retrieves the user's recent orders (requires authentication)
 *       - `categories` — lists all available store categories
 *       - `checkout` — guides through payment and cart flow
 *       - `shipping` — shipping costs and delivery times
 *       - `returns` — return and refund policy
 *       - `account` — login, registration, and profile help
 *       - `general` — general store questions
 *
 *       Conversation history (last 8 messages) is used for context continuity.
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to the chatbot
 *                 example: Do you have wireless headphones under $100?
 *               conversationHistory:
 *                 type: array
 *                 description: Previous messages for context (max 8 used)
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                       example: user
 *                     content:
 *                       type: string
 *                       example: What categories do you have?
 *     responses:
 *       200:
 *         description: Chatbot response with intent classification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reply:
 *                   type: string
 *                   description: The chatbot's response text
 *                   example: "Yes! We have the Sony WH-1000XM5 for $89.99 (was $129.99). It's currently in stock with 15 units available."
 *                 role:
 *                   type: string
 *                   example: assistant
 *                 intent:
 *                   type: string
 *                   enum: [products, orders, categories, checkout, shipping, returns, account, general]
 *                   description: Detected intent for the message
 *                   example: products
 *       400:
 *         description: Message is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Message is required
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Groq API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/message', optionalAuth, sendMessage);

module.exports = router;
