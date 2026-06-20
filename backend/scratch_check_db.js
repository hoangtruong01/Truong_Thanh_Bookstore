const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://giaoductruongthanh_db_user:truongthanh_store@cluster0.fazykch.mongodb.net/truong-thanh-stationery?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  const Inventory = mongoose.model('Inventory', new mongoose.Schema({}, { strict: false }), 'inventories');

  const productsCount = await Product.countDocuments({});
  const inventoriesCount = await Inventory.countDocuments({});

  console.log('Products in DB:', productsCount);
  console.log('Inventories in DB:', inventoriesCount);

  if (inventoriesCount > 0) {
    const inventories = await Inventory.find({});
    console.log('\nInventories sample:');
    for (const inv of inventories.slice(0, 5)) {
      console.log({
        _id: inv._id,
        product: inv.product,
        currentStock: inv.currentStock,
        status: inv.status,
        productType: typeof inv.product,
        isObjectId: inv.product instanceof mongoose.Types.ObjectId
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
