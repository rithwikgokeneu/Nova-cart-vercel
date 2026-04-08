const RecentlyViewed = require('../models/RecentlyViewed');

const recordView = async (req, res) => {
  try {
    const { productId } = req.params;
    let doc = await RecentlyViewed.findOne({ user: req.user._id });
    if (!doc) doc = await RecentlyViewed.create({ user: req.user._id, products: [] });

    // Remove if already present, then unshift to front
    doc.products = doc.products.filter(p => p.product.toString() !== productId);
    doc.products.unshift({ product: productId, viewedAt: new Date() });
    doc.products = doc.products.slice(0, 10); // keep last 10
    await doc.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const doc = await RecentlyViewed.findOne({ user: req.user._id })
      .populate({ path: 'products.product', populate: { path: 'category', select: 'name' } });
    const products = doc ? doc.products.map(p => p.product).filter(Boolean) : [];
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordView, getRecentlyViewed };
