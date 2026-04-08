const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendCancellationRequestEmail, sendCancellationApprovedEmail, sendCancellationRejectedEmail } = require('../utils/email');

const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentIntentId, notes, couponCode, discountAmount } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${product?.title || 'unknown'} is no longer available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
      }
      orderItems.push({
        product: product._id,
        title: product.title,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: item.quantity,
        image: product.images[0] || ''
      });
      totalAmount += (product.discountPrice > 0 ? product.discountPrice : product.price) * item.quantity;
      product.stock -= item.quantity;
      await product.save();
    }

    // Apply coupon discount
    const appliedDiscount = discountAmount > 0 ? discountAmount : 0;
    // Apply gift points (1 point = $1, capped at available balance)
    const requestedGiftPoints = parseFloat(req.body.giftPointsUsed) || 0;
    const customer = await User.findById(req.user._id);
    const usableGiftPoints = Math.min(requestedGiftPoints, customer.giftPoints || 0);
    const finalTotal = Math.max(0, totalAmount - appliedDiscount - usableGiftPoints);

    // Validate and increment coupon usage
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.usedCount < coupon.maxUses && new Date() <= coupon.expiresAt) {
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    // Deduct gift points used
    if (usableGiftPoints > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { giftPoints: -Math.ceil(usableGiftPoints) } });
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount: finalTotal,
      shippingAddress,
      paymentIntentId,
      paymentStatus: paymentIntentId ? 'paid' : 'pending',
      status: paymentIntentId ? 'processing' : 'pending',
      notes,
      couponCode: couponCode || '',
      discountAmount: appliedDiscount,
      giftPointsUsed: usableGiftPoints
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user._id);
      await sendOrderConfirmationEmail(user.email, user.name, order);
    } catch (emailErr) {
      console.error('Order confirmation email failed:', emailErr.message);
    }

    const populated = await Order.findById(order._id).populate('customer', 'name email');
    res.status(201).json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.status ? { status: req.query.status } : {};

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);
    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const { status } = req.body;
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    order.status = status;
    if (status === 'delivered') order.paymentStatus = 'paid';
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const CANCEL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Only pending orders can be cancelled' });

    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    if (elapsed > CANCEL_WINDOW_MS) {
      return res.status(400).json({ message: 'Cancellation window has expired. Orders can only be cancelled within 1 hour of placement.' });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestReplacement = async (req, res) => {
  try {
    const { itemTitle, reason, note } = req.body;
    if (!itemTitle || !reason) return res.status(400).json({ message: 'Item and reason are required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (order.status !== 'delivered') return res.status(400).json({ message: 'Replacement requests are only available for delivered orders' });

    const hasActive = order.replacementRequests?.some(r => r.status === 'pending' || r.status === 'approved');
    if (hasActive) return res.status(400).json({ message: 'You already have an active replacement request for this order' });

    order.replacementRequests.push({ itemTitle, reason, note: note || '' });
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: 'Invalid order ID format' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(i => ({ title: i.title, quantity: i.quantity })),
        shippingAddress: {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const vendorProducts = await Product.find({ vendor: req.user._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('customer', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyAnalytics = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = data.map(d => ({
      month: `${months[d._id.month - 1]} ${d._id.year}`,
      revenue: parseFloat(d.revenue.toFixed(2)),
      orders: d.orders
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendorAnalytics = async (req, res) => {
  try {
    const vendorProducts = await Product.find({ vendor: req.user._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);

    const data = await Order.aggregate([
      { $match: { 'items.product': { $in: productIds }, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = data.map(d => ({
      month: `${months[d._id.month - 1]} ${d._id.year}`,
      revenue: parseFloat(d.revenue.toFixed(2)),
      orders: d.orders
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find().populate('customer', 'name email').sort({ createdAt: -1 });

    const header = 'Order ID,Customer,Email,Status,Payment,Total,Discount,Coupon,Items,Date\n';
    const rows = orders.map(o =>
      [
        o._id.toString().slice(-8).toUpperCase(),
        `"${o.customer?.name || 'N/A'}"`,
        o.customer?.email || 'N/A',
        o.status,
        o.paymentStatus,
        o.totalAmount.toFixed(2),
        o.discountAmount?.toFixed(2) || '0.00',
        o.couponCode || '',
        o.items.length,
        new Date(o.createdAt).toLocaleDateString()
      ].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Cancellation can only be requested for pending or processing orders' });
    }
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order has not been paid' });
    }
    if (order.cancellationRequest?.status === 'pending') {
      return res.status(400).json({ message: 'A cancellation request is already pending' });
    }

    order.cancellationRequest = { reason, status: 'pending', requestedAt: new Date() };
    await order.save();

    // Notify all unique vendors who have products in this order
    const productIds = order.items.map(i => i.product);
    const vendorProducts = await Product.find({ _id: { $in: productIds } }).populate('vendor', 'name email');
    const seen = new Set();
    for (const p of vendorProducts) {
      if (p.vendor?.email && !seen.has(p.vendor.email)) {
        seen.add(p.vendor.email);
        try { await sendCancellationRequestEmail(p.vendor.email, p.vendor.name, order, req.user.name); }
        catch (e) { console.error('Vendor notification failed:', e.message); }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveCancellation = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending cancellation request on this order' });
    }

    // Vendor must own at least one product in the order (admin can always resolve)
    if (req.user.role !== 'admin') {
      const vendorProductIds = (await Product.find({ vendor: req.user._id }).select('_id')).map(p => p._id.toString());
      const hasProduct = order.items.some(i => vendorProductIds.includes(i.product?.toString()));
      if (!hasProduct) return res.status(403).json({ message: 'Not authorized to resolve this order' });
    }

    order.cancellationRequest.resolvedAt = new Date();
    const orderCustomer = await User.findById(order.customer);

    if (action === 'approve') {
      order.cancellationRequest.status = 'approved';
      order.status = 'cancelled';
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      const pointsToAdd = Math.round(order.totalAmount);
      await User.findByIdAndUpdate(order.customer, { $inc: { giftPoints: pointsToAdd } });
      try { await sendCancellationApprovedEmail(orderCustomer.email, orderCustomer.name, order, pointsToAdd); }
      catch (e) { console.error('Customer email failed:', e.message); }
    } else {
      order.cancellationRequest.status = 'rejected';
      try { await sendCancellationRejectedEmail(orderCustomer.email, orderCustomer.name, order); }
      catch (e) { console.error('Customer email failed:', e.message); }
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder, getAllOrders, getOrderById, getUserOrders,
  updateOrderStatus, cancelOrder, trackOrder,
  getVendorOrders, getMonthlyAnalytics, getVendorAnalytics, exportOrdersCSV,
  requestReplacement, requestCancellation, resolveCancellation
};
