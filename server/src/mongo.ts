import mongoose from 'mongoose';
import { MONGO_URL } from '../env';

export async function connectMongo() {
  if (!MONGO_URL) {
    throw new Error('MONGO_URI não definida no .env');
  }

  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado ao MongoDB');
}
