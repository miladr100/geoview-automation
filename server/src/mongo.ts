import mongoose from 'mongoose';
import { MONGO_URL, SESSION_ID } from '../env';
import { deleteRemoteAuthSession } from './utils/functions';

export async function connectMongo() {
  if (!MONGO_URL) {
    throw new Error('MONGO_URI não definida no .env');
  }

  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado ao MongoDB');
  //deleteRemoteAuthSession(SESSION_ID)
  //  .then(() => console.log('✅ Sessão remota deletada com sucesso'))
  //  .catch(err => console.error('❌ Erro ao deletar sessão remota:', err));
}
