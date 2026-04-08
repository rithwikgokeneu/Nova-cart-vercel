const Wishlist = require('../models/Wishlist');

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({ path: 'products', populate: { path: 'category', select: 'name' } });
    if (!wishlist) wishlist = { products: [] };
    res.json({ success: true, products: wishlist.products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    const index = wishlist.products.indexOf(productId);
    let inWishlist;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      inWishlist = false;
    } else {
      wishlist.products.push(productId);
      inWishlist = true;
    }
    await wishlist.save();
    res.json({ success: true, inWishlist, wishlistCount: wishlist.products.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWishlist, toggleWishlist };
