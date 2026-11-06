import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Dress from '../models/Dress.model.js';

async function verify() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wedding_dress_rental';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
  } catch {
    await mongoose.connect('mongodb://127.0.0.1:27017/wedding_dress_rental');
  }

  const sample = await Dress.findOne({ code: 'UB-001' }).lean();
  console.log('UB-001 Code:', sample.code);
  console.log('UB-001 Name:', sample.name);
  console.log('UB-001 Images:', JSON.stringify(sample.images, null, 2));

  const total = await Dress.countDocuments({});
  console.log('Total dresses in dresses collection:', total);

  // Check collections list to prove no other collections modified
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Existing DB Collections:', collections.map(c => c.name).join(', '));

  await mongoose.disconnect();
}
verify();

