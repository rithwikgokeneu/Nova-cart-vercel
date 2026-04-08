const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nova Cart E-Commerce API',
      version: '1.0.0',
      description: 'Full-stack e-commerce REST API supporting Customer, Vendor, and Admin roles. Built with Node.js, Express, and MongoDB.'
    },
    servers: [
      { url: process.env.API_URL || 'http://localhost:5001', description: 'API server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Obtain it from POST /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name:      { type: 'string', example: 'John Doe' },
            email:     { type: 'string', example: 'john@example.com' },
            role:      { type: 'string', enum: ['customer', 'vendor', 'admin'] },
            avatar:    { type: 'string', example: '/uploads/avatar.jpg' },
            phone:     { type: 'string', example: '+1 555 000 1234' },
            isActive:  { type: 'boolean', example: true },
            address: {
              type: 'object',
              properties: {
                street:  { type: 'string' },
                city:    { type: 'string' },
                state:   { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id:           { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
            title:         { type: 'string', example: 'Wireless Headphones' },
            description:   { type: 'string', example: 'Premium noise-cancelling headphones' },
            price:         { type: 'number', example: 99.99 },
            discountPrice: { type: 'number', example: 79.99 },
            stock:         { type: 'integer', example: 50 },
            images:        { type: 'array', items: { type: 'string' } },
            category:      { $ref: '#/components/schemas/Category' },
            vendor:        { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' } } },
            ratings:       { type: 'number', example: 4.5 },
            numReviews:    { type: 'integer', example: 12 },
            isActive:      { type: 'boolean', example: true },
            createdAt:     { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
            name:        { type: 'string', example: 'Electronics' },
            description: { type: 'string', example: 'Gadgets and devices' },
            image:       { type: 'string' },
            isActive:    { type: 'boolean', example: true }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            customer:        { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } } },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product:  { type: 'string' },
                  title:    { type: 'string' },
                  price:    { type: 'number' },
                  quantity: { type: 'integer' },
                  image:    { type: 'string' }
                }
              }
            },
            totalAmount:     { type: 'number', example: 149.98 },
            status:          { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
            paymentStatus:   { type: 'string', enum: ['pending', 'paid', 'failed'] },
            paymentIntentId: { type: 'string' },
            shippingAddress: {
              type: 'object',
              properties: {
                street:  { type: 'string' },
                city:    { type: 'string' },
                state:   { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            notes:     { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            product:  { $ref: '#/components/schemas/Product' },
            quantity: { type: 'integer', example: 2 }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id:   { type: 'string' },
            user:  { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } }
          }
        },
        Review: {
          type: 'object',
          properties: {
            _id:      { type: 'string' },
            customer: { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' } } },
            product:  { type: 'string' },
            rating:   { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            comment:  { type: 'string', example: 'Great product!' },
            createdAt:{ type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token:   { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user:    { $ref: '#/components/schemas/User' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error description' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' }
          }
        },
        Coupon: {
          type: 'object',
          properties: {
            _id:            { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d9' },
            code:           { type: 'string', example: 'SAVE20' },
            discountType:   { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
            discountValue:  { type: 'number', example: 20 },
            minOrderAmount: { type: 'number', example: 50 },
            maxUses:        { type: 'integer', example: 100 },
            usedCount:      { type: 'integer', example: 3 },
            expiresAt:      { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59Z' },
            isActive:       { type: 'boolean', example: true },
            createdAt:      { type: 'string', format: 'date-time' }
          }
        },
        Wishlist: {
          type: 'object',
          properties: {
            _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0da' },
            user:     { type: 'string', description: 'User ObjectId' },
            products: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' },
              description: 'Populated product documents'
            },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RecentlyViewed: {
          type: 'object',
          properties: {
            _id:  { type: 'string' },
            user: { type: 'string', description: 'User ObjectId' },
            products: {
              type: 'array',
              description: 'Up to 10 products, newest first',
              items: {
                type: 'object',
                properties: {
                  product:  { $ref: '#/components/schemas/Product' },
                  viewedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
