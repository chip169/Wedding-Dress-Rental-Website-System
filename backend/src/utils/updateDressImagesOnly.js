import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Dress from '../models/Dress.model.js';

async function updateDressImagesOnly() {
  try {
    console.log('Connecting to MongoDB...');
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wedding_dress_rental';
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    } catch {
      await mongoose.connect('mongodb://127.0.0.1:27017/wedding_dress_rental');
    }
    console.log('Connected to MongoDB successfully!');

    // ONLY touch the dresses collection
    const dresses = await Dress.find({});
    console.log(`Found ${dresses.length} dresses in 'dresses' collection.`);

    let updatedCount = 0;
    for (const d of dresses) {
      // Determine dress number string (e.g. "01", "02")
      let numStr = '01';
      if (d.code && d.code.startsWith('UB-')) {
        const n = parseInt(d.code.replace('UB-', ''), 10);
        if (!isNaN(n)) {
          numStr = n < 10 ? `0${n}` : `${n}`;
        }
      } else if (d.images && d.images[0]) {
        const match = d.images[0].match(/dress_(\d+)\.jpg/);
        if (match) numStr = match[1];
      }

      const newImages = [
        `/assets/dresses/dress_${numStr}.jpg`,
        `/assets/dresses/dress_${numStr}_mannequin.jpg`,
        `/assets/dresses/dress_${numStr}_left.jpg`,
        `/assets/dresses/dress_${numStr}_right.jpg`,
      ];
      if (numStr === '25' || numStr === '24' || numStr === '23' || numStr === '22' || numStr === '21' || numStr === '20' || numStr === '19' || numStr === '18' || numStr === '17' || numStr === '16' || numStr === '15' || numStr === '14' || numStr === '13' || numStr === '12' || numStr === '10' || numStr === '01') {
        newImages.push(`/assets/dresses/dress_${numStr}_banquet.jpg`);
      }

      await Dress.updateOne(
        { _id: d._id },
        { 
          $set: { 
            images: newImages,
            'story.atelierImage': `/assets/dresses/dress_${numStr}_mannequin.jpg`,
          } 
        }
      );
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} dresses in 'dresses' collection only.`);
    console.log('STRICT CONFIRMATION: Zero other collections were modified.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB cleanly.');
  } catch (error) {
    console.error('Error updating dresses collection:', error);
    process.exit(1);
  }
}

updateDressImagesOnly();

