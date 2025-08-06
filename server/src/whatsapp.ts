// whatsapp.ts
import qrcode from 'qrcode';
import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { Server } from 'socket.io';
import { MongoStore } from 'wwebjs-mongo';
import {
  deleteRemoteAuthSession,
  destroyLocalClient,
  getMessageAndRedirect
} from './utils/functions';
import { SESSION_ID, MONGO_URL, ENVIRONMENT } from '../env';

declare global {
  var _whatsappClient: Client | undefined;
  var _socketIO: Server | undefined;
}

let io: Server | undefined = global._socketIO;
let client: Client | undefined = global._whatsappClient;

let lastQrCode: string | null = null;
let isInitializing = false;

export async function initWhatsApp(socketServer?: Server) {
  if (isInitializing || client?.info) {
    console.log('⚠️ Cliente WhatsApp já está sendo inicializado ou pronto. Ignorando nova tentativa.');
    return;
  }

  isInitializing = true;

  if (!MONGO_URL) throw new Error("MONGO_URL não definido");
  if (!io && !socketServer) throw new Error("Socket não definido");

  io = socketServer ?? global._socketIO ?? io;

  try {
    const mongoStore = new MongoStore({ mongoose });

    client = client ? client : new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
        executablePath: ENVIRONMENT === "dev" ? puppeteer.executablePath() : "/usr/bin/chromium-browser",
      },
      authStrategy: new RemoteAuth({
        clientId: SESSION_ID,
        store: mongoStore,
        backupSyncIntervalMs: 300000,
      }),
    });

    global._whatsappClient = client;

    setupClientEvents(client, io!);

    await client.initialize();
    console.log("✅ Cliente WhatsApp inicializado com sucesso...");
  } catch (err) {
    console.error("❌ Erro ao inicializar WhatsApp:", err);
    console.log("🗑️ Tentando deletar sessão e reiniciar cliente...");
    await destroyLocalClient()
      .then(() => console.log('✅ Cliente local destruído com sucesso'))
      .catch(err => console.error('❌ Erro ao destruir cliente local:', err));
    await deleteRemoteAuthSession(SESSION_ID)
      .then(() => console.log('✅ Sessão remota deletada com sucesso'))
      .catch(err => console.error('❌ Erro ao deletar sessão remota:', err));

    // Aguarda um pouco e tenta de novo
    setTimeout(() => {
      console.log('🔄 Reiniciando cliente...');
      initWhatsApp(io);
    }, 5000);
  }
}

function setupClientEvents(client: Client, ioSock: Server) {
  // Event listeners for auth 
  client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
  });

  client.on('change_state', state => {
    console.log('📶 Estado atual do WhatsApp:', state);
  });

  client.on('error', err => {
    console.error('❗ Erro no cliente WhatsApp:', err);
  });

  // Event listeners for the WhatsApp client
  client.on('remote_session_saved', () => {
    console.log('💾 Sessão salva no MongoDB');
  });

  client.on('qr', async (qr: string) => {
    console.log('📲 Novo QR gerado');

    // Mostra no terminal
    qrcodeTerminal.generate(qr, { small: true });

    // Gera versão base64 para o frontend via socket
    lastQrCode = await qrcode.toDataURL(qr);
    ioSock.emit('qr', lastQrCode);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp conectado.');
    ioSock.emit('ready', true);
  });

  client.on('disconnected', () => {
    console.log('🔌 WhatsApp desconectado.');
    ioSock.emit('ready', false);
  });

  client.on('message', async (msg) => {
    // ✅ Ignora mensagens que não sejam de contatos diretos (ex: grupos, status, broadcast)
    if (!msg.from.endsWith('@c.us')) {
      console.log(`📵 Mensagem ignorada de ${msg.from}: ${msg.body}`);
      return;
    }
    console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);
    await getMessageAndRedirect(msg, client);
  });
}

export function getClient(): Client {
  if (!client) {
    throw new Error("WhatsApp client não inicializado. Chame initWhatsApp() primeiro.");
  }
  return client;
}

export function deleteClient() {
  if (!client) {
    console.warn("WhatsApp client não inicializado para deletar.");
    return;
  }
  global._whatsappClient = undefined;
  isInitializing = false;
  client = undefined;
}

export { client };
