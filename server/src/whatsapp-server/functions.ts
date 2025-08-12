import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { getClient, deleteClient } from './whatsapp';

const SESSION_AUTH_FOLDER = '.wwebjs_auth';
const SESSION_CASH_FOLDER = '.wwebjs_cache';

export async function deleteRemoteAuthSession(clientId: string) {
  const db = mongoose.connection.db;

  const base = `whatsapp-RemoteAuth-${clientId}`;

  try {
    const files = db?.collection(`${base}.files`);
    const chunks = db?.collection(`${base}.chunks`);

    const resultFiles = await files?.deleteMany({});
    const resultChunks = await chunks?.deleteMany({});

    console.log(`🗑 Sessão "${clientId}" removida com sucesso.`);
    console.log(`> arquivos: ${resultFiles?.deletedCount}, chunks: ${resultChunks?.deletedCount}`);
  } catch (err) {
    console.error('Erro ao apagar sessão manualmente:', err);
  }
}

export function deleteLocalAuthSession() {
  const sessionPath = path.join(process.cwd(), SESSION_AUTH_FOLDER);
  const sessionCashPath = path.join(process.cwd(), SESSION_CASH_FOLDER);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`🗑 Sessão auth local antiga removida`);
  }
  if (fs.existsSync(sessionCashPath)) {
    fs.rmSync(sessionCashPath, { recursive: true, force: true });
    console.log(`🗑 Sessão cash local antiga removida`);
  }
}

export async function destroyLocalClient() {
  const client = getClient();

  await client.destroy();

  const store = (client as any).authStrategy?.store;
  if (store && typeof store.delete === 'function') {
    deleteClient();
  }
}