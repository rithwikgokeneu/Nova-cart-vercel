const Product = require('../models/Product');
const Review = require('../models/Review');

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.vendor) filter.vendor = req.query.vendor;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const sortOptions = {};
    if (req.query.sort === 'price_asc') sortOptions.price = 1;
    else if (req.query.sort === 'price_desc') sortOptions.price = -1;
    else if (req.query.sort === 'rating') sortOptions.ratings = -1;
    else sortOptions.createdAt = -1;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('vendor', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);
    res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('vendor', 'name email avatar');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reviews = await Review.find({ product: product._id })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, product, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, description, price, discountPrice, category, stock, tags, brand } = req.body;
    const images = req.files ? req.files.map(f => f.path) : [];

    const product = await Product.create({
      title, description, price, discountPrice, category,
      stock, tags: tags ? tags.split(',').map(t => t.trim()) : [],
      brand, images, vendor: req.user._id
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('vendor', 'name email');

    res.status(201).json({ success: true, product: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const fields = ['title', 'description', 'price', 'discountPrice', 'stock', 'brand', 'isActive'];
    fields.forEach(field => { if (req.body[field] !== undefined) product[field] = req.body[field]; });
    if (req.body.category) product.category = req.body.category;
    if (req.body.tags) product.tags = req.body.tags.split(',').map(t => t.trim());
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => f.path);
    }

    const updated = await product.save();
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingReview = await Review.findOne({ product: req.params.id, customer: req.user._id });
    if (existingReview) return res.status(400).json({ message: 'You have already reviewed this product' });

    const review = await Review.create({
      product: req.params.id,
      customer: req.user._id,
      rating, comment
    });

    const reviews = await Review.find({ product: req.params.id });
    product.numReviews = reviews.length;
    product.ratings = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await product.save();

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const related = await Product.find({
      category: product.category,
      isActive: true,
      _id: { $ne: product._id }
    }).populate('category', 'name').limit(6);

    res.json({ success: true, products: related });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getVendorProducts, createReview, getRelatedProducts };
