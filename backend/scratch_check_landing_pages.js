const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://giaoductruongthanh_db_user:truongthanh_store@cluster0.fazykch.mongodb.net/truong-thanh-stationery?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const LandingPage = mongoose.model('LandingPage', schema, 'landingpages');
  
  const pages = await LandingPage.find({}).lean();
  console.log(`Total landing pages found: ${pages.length}`);
  console.log(JSON.stringify(pages, null, 2));
  
  await mongoose.connection.close();
}

run();
