const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'customer' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@novacart.com' });
    if (existing) {
      console.log('Admin already exists:');
      console.log('  Email:    admin@novacart.com');
      console.log('  Password: Admin@123');
      await mongoose.disconnect();
      return;
    }

    const hashed = await bcrypt.hash('Admin@123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@novacart.com',
      password: hashed,
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('  Email:    admin@novacart.com');
    console.log('  Password: Admin@123');
    console.log('\nLogin at: http://localhost:5173/login');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
