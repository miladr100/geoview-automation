// whatsapp.ts
import qrcode from 'qrcode';
import puppeteer from 'puppeteer';
//import mongoose from 'mongoose';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { Server } from 'socket.io';
//import { MongoStore } from 'wwebjs-mongo';
import { handleIncomingMessage, deleteLocalAuthSession } from './utils/functions';
import { SESSION_ID, MONGO_URL } from '../env';

declare global {
  var _whatsappClient: Client | undefined;
  var _socketIO: Server | undefined;
}

let io: Server | undefined = global._socketIO;
let client: Client | undefined = global._whatsappClient;

let lastQrCode: string | null = null;

export async function initWhatsApp(socketServer?: Server) {
  if (!MONGO_URL) throw new Error("MONGO_URL não definido");
  if (!io && !socketServer) throw new Error("Socket não definido");
  deleteLocalAuthSession();

  io = socketServer ?? global._socketIO ?? io;

  //const mongoStore = new MongoStore({ mongoose });

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
      executablePath: puppeteer.executablePath()
    },
    authStrategy: new LocalAuth({
      clientId: SESSION_ID,
    }),
  });

  global._whatsappClient = client;

  setupClientEvents(client, io!);

  client.initialize();
  console.log("✅ Cliente WhatsApp inicializado com sucesso...");
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
    console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);
    await handleIncomingMessage(msg, client);
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
  client = undefined;
}

export { client };
