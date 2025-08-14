import mongoose from 'mongoose';
import { MONGO_URL } from '../../env';
import {
  deleteLocalAuthSession,
  cleanupOldSessions,
} from './functions';

export async function connectMongo() {
  if (!MONGO_URL) {
    throw new Error('MONGO_URI não definida no .env');
  }

  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado ao MongoDB');
  deleteLocalAuthSession();
  await cleanupOldSessions()
    .catch(err => console.error('❌ Erro ao deletar sessões antigas:', err));
}
