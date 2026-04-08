const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const isRealKey = STRIPE_KEY && !STRIPE_KEY.includes('your_stripe_key') && STRIPE_KEY.startsWith('sk_test_');
const stripe = isRealKey ? require('stripe')(STRIPE_KEY) : null;

const createCheckoutSession = async (req, res) => {
  try {
    const { items, shipping } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items provided' });

    if (!stripe) {
      return res.json({
        success: true,
        url: `${process.env.CLIENT_URL}/checkout/success?session_id=demo_${Date.now()}`,
        demo: true
      });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.title },
        unit_amount: Math.round((item.discountPrice > 0 ? item.discountPrice : item.price) * 100),
      },
      quantity: item.quantity,
    }));

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error:', error.message);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
};

const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!stripe || sessionId.startsWith('demo_')) {
      return res.json({ success: true, paid: true, paymentIntentId: sessionId });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      success: true,
      paid: session.payment_status === 'paid',
      paymentIntentId: session.payment_intent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // If no real Stripe key, return a mock intent for demo/development
    if (!stripe) {
      return res.json({
        success: true,
        clientSecret: `pi_demo_${Date.now()}_secret_demo`,
        paymentIntentId: `pi_demo_${Date.now()}`,
        demo: true
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user._id.toString() }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ message: 'Payment processing unavailable. Please try again.' });
  }
};

const getPaymentIntent = async (req, res) => {
  try {
    if (!stripe || req.params.id.startsWith('pi_demo_')) {
      return res.json({ success: true, paymentIntent: { id: req.params.id, status: 'succeeded' } });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({ success: true, paymentIntent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPaymentIntent, getPaymentIntent, createCheckoutSession, verifyCheckoutSession };
