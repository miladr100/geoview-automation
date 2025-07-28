// src/lib/whatsapp.ts
import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { handleIncomingMessage } from "@/utils/functions";

declare global {
  var _whatsappClient: Client | undefined;
  var _socketIO: Server | undefined;
}

let io: Server | undefined = global._socketIO;
let client: Client | undefined = global._whatsappClient;

const MONGO_URL = "mongodb+srv://miladr100:29051997pc@whatsjs-bot.v2qutgh.mongodb.net/";
console.log("env: ", process.env.MONGODB_URI);

let lastQrCode: string | null = null;

export async function initWhatsApp(socketServer?: Server) {
  if (!MONGO_URL) throw new Error("MONGODB_URI não definido");
  if (!io && !socketServer) throw new Error("Socket não definido");

  io = socketServer ?? (global as any)._socketIO ?? io;

  // Evita conectar mais de uma vez
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URL);
  }

  if (client) {
    await client.destroy();
  }

  const mongoStore = new MongoStore({ mongoose });

  client = new Client({
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: require('puppeteer').executablePath()
    },
    authStrategy: new RemoteAuth({
      clientId: 'geoview',
      store: mongoStore,
      backupSyncIntervalMs: 300000
    }),
  });

  global._whatsappClient = client;

  setupClientEvents(client, io);

  client.initialize();
  console.log("✅ Cliente WhatsApp inicializado com sucesso...");
}

function setupClientEvents(client: Client, ioSock = io) {
  client.on('remote_session_saved', () => {
    console.log('Sessão salva no MongoDB');
  });

  client.on('qr', async (qr: string) => {
    console.log('📲 Novo QR gerado');
    lastQrCode = await qrcode.toDataURL(qr);
    ioSock?.emit('qr', lastQrCode);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp conectado.');
    ioSock?.emit('ready', true);
  });

  client.on('disconnected', () => {
    console.log('🔌 WhatsApp desconectado.');
    ioSock?.emit('ready', false);
  });

  client.on('message', async (msg) => {
    handleIncomingMessage(msg, client);
  });
}

export function getClient(): Client {
  if (!client) {
    throw new Error("WhatsApp client não inicializado. Chame initWhatsApp() primeiro.");
  }
  console.log("geting-client: ", client)
  return client;
}

export function deleteClient() {
  if (!client) {
    console.warn("WhatsApp client não inicializado para deletar.");
    return
  }
  console.log("deleting-client: ", client)
  global._whatsappClient = undefined;
  client = undefined;
}

export { client };