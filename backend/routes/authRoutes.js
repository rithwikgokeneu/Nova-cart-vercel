const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, googleCallback, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — register, login, Google OAuth, current user
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a customer or vendor account. Admin accounts cannot be self-registered.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [customer, vendor]
 *                 default: customer
 *                 example: customer
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: User already exists with this email
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Returns a JWT token valid for 30 days. Use it as a Bearer token in subsequent requests.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@novacart.com
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or deactivated account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   message: Invalid email or password
 *               deactivated:
 *                 value:
 *                   message: Account is deactivated
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth 2.0 sign-in
 *     description: Redirects the browser to Google's OAuth consent screen. On success, Google redirects to /api/auth/google/callback which issues a JWT and redirects to the frontend.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent page
 */
router.get('/google', (req, res, next) => {
  const role = req.query.role === 'vendor' ? 'vendor' : 'customer';
  const intent = req.query.intent === 'signup' ? 'signup' : 'login';
  const state = intent === 'signup' ? `signup_${role}` : 'login';
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 callback
 *     description: Handles the redirect from Google after user consent. Issues a JWT and redirects to the frontend at /auth/google/success?token=...&role=...
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code returned by Google (handled automatically)
 *     responses:
 *       302:
 *         description: Redirects to frontend with JWT token and role in query params
 */
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
      if (!user) {
        if (info?.message === 'email_taken') {
          return res.redirect(`${process.env.CLIENT_URL}/register?error=email_taken`);
        }
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     description: Returns the full profile of the user whose JWT is provided in the Authorization header.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     description: |
 *       Looks up the account by email. If found, generates a secure random token (expires in 1 hour),
 *       saves it to the user document, and sends a password reset link to the email address via Gmail.
 *       Always returns 200 to prevent user enumeration — even if the email is not found.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       404:
 *         description: No account found with that email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: No account found with that email
 *       500:
 *         description: Failed to send email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using the emailed token
 *     description: |
 *       Validates the token from the reset email link (must not be expired).
 *       Hashes the new password with bcrypt and clears the token fields from the user document.
 *       The token is valid for 1 hour from when the forgot-password request was made.
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset token from the emailed link (hex string)
 *         example: a3f8e2c1d4b7...
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: The new password
 *                 example: newSecret123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Token is invalid or has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Reset token is invalid or has expired
 */
router.post('/reset-password/:token', resetPassword);

module.exports = router;
