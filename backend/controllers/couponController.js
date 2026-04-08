const Coupon = require('../models/Coupon');

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });
    const coupon = await Coupon.create({ code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, createdBy: req.user._id });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (cartTotal < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount is $${coupon.minOrderAmount}` });

    const discountAmount = coupon.discountType === 'percentage'
      ? parseFloat(((cartTotal * coupon.discountValue) / 100).toFixed(2))
      : Math.min(coupon.discountValue, cartTotal);

    res.json({ success: true, discountType: coupon.discountType, discountValue: coupon.discountValue, discountAmount, code: coupon.code });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCoupon, getCoupons, deleteCoupon, validateCoupon };
