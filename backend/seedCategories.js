const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  { name: 'Electronics', description: 'Phones, laptops, gadgets and more' },
  { name: 'Clothing', description: 'Men\'s, women\'s and kids apparel' },
  { name: 'Home & Kitchen', description: 'Furniture, appliances and kitchen essentials' },
  { name: 'Books', description: 'Fiction, non-fiction, textbooks and more' },
  { name: 'Sports & Outdoors', description: 'Equipment, gear and activewear' },
  { name: 'Beauty & Personal Care', description: 'Skincare, haircare and grooming' },
  { name: 'Toys & Games', description: 'Toys, board games and puzzles' },
  { name: 'Automotive', description: 'Car parts, accessories and tools' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;
  for (const cat of categories) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      console.log(`Created: ${cat.name}`);
      created++;
    } else {
      console.log(`Skipped (already exists): ${cat.name}`);
      skipped++;
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
