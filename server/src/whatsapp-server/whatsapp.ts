// whatsapp.ts
import qrcode from 'qrcode';
import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { Server } from 'socket.io';
import { MongoStore } from 'wwebjs-mongo';
import {
  destroyLocalClient,
  deleteLocalAuthSession,
  handleProcessMessage,
  generateUniqueClientId,
  deleteRemoteAuthSessionByClientId,
} from './functions';
import { SESSION_ID, MONGO_URL, ENVIRONMENT } from '../../env';

declare global {
  var _whatsappClient: Client | undefined;
  var _socketIO: Server | undefined;
}

let io: Server | undefined = global._socketIO;
let client: Client | undefined = global._whatsappClient;

let lastQrCode: string | null = null;
let isInitializing = false;
let retryCount = 0;
let currentClientId: string | null = null;
const MAX_RETRIES = 5;
const BASE_DELAY = 5000; // 5 segundos

// Função para obter o ID do cliente atual
export function getCurrentClientId(): string | null {
  return currentClientId;
}

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
    
    // Gera novo ID único para esta sessão
    currentClientId = generateUniqueClientId();
    console.log(`🆔 ID único da sessão: ${currentClientId}`);

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
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--no-first-run',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        executablePath: ENVIRONMENT === "dev" ? puppeteer.executablePath() : "/usr/bin/chromium-browser",
      },
      authStrategy: new RemoteAuth({
        clientId: currentClientId, // Usa o ID único gerado
        store: mongoStore,
        backupSyncIntervalMs: 300000,
        rmMaxRetries: 3,
      }),
    });

    global._whatsappClient = client;

    setupClientEvents(client, io!);

    await client.initialize();
    console.log(`✅ Cliente WhatsApp inicializado com sucesso... (ID: ${currentClientId})`);
    
    // Reset retry count on success
    retryCount = 0;
  } catch (err) {
    console.error("❌ Erro ao inicializar WhatsApp:", err);
    
    // Check if we've exceeded max retries
    if (retryCount >= MAX_RETRIES) {
      console.error(`🛑 Máximo de tentativas (${MAX_RETRIES}) atingido. Parando tentativas de reconexão.`);
      isInitializing = false;
      retryCount = 0;
      currentClientId = null; // Reset client ID
      return;
    }
    
    retryCount++;
    console.log(`🗑️ Tentativa ${retryCount}/${MAX_RETRIES}: Deletando sessão e reiniciando cliente...`);
    
    try {
      await destroyLocalClient()
        .then(() => console.log('✅ Cliente local destruído com sucesso'))
        .catch(err => console.error('❌ Erro ao destruir cliente local:', err));
      
      // Deleta a sessão específica que falhou
      if (currentClientId) {
        await deleteRemoteAuthSessionByClientId(currentClientId)
          .then(() => console.log(`✅ Sessão ${currentClientId} deletada com sucesso`))
          .catch(err => console.error('❌ Erro ao deletar sessão remota:', err));
      }
    } catch (cleanupErr) {
      console.error('❌ Erro durante limpeza:', cleanupErr);
    }

    // Calculate exponential backoff delay
    const delay = BASE_DELAY * Math.pow(2, retryCount - 1);
    console.log(`⏰ Próxima tentativa em ${delay / 1000} segundos...`);
    
    // Schedule next attempt with exponential backoff
    setTimeout(() => {
      console.log(`🔄 Tentativa ${retryCount}/${MAX_RETRIES} de reconexão...`);
      isInitializing = false; // Reset flag to allow retry
      currentClientId = null; // Reset client ID for new attempt
      initWhatsApp(io);
    }, delay);
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

    // Adicionar verificação específica para erros de arquivo
    if (err.code === 'ENOENT') {
      console.log('��️ Arquivo de sessão não encontrado, limpando sessão...');
      // Limpar sessão corrompida
      deleteLocalAuthSession();
    }
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
    await handleProcessMessage(msg, client);
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
  retryCount = 0; // Reset retry count when deleting client
  currentClientId = null; // Reset current client ID
  client = undefined;
}

// Função para resetar manualmente o contador de tentativas
export function resetRetryCount() {
  retryCount = 0;
  console.log('🔄 Contador de tentativas resetado.');
}

// Função para verificar o status atual das tentativas
export function getRetryStatus() {
  return {
    retryCount,
    maxRetries: MAX_RETRIES,
    isInitializing,
    hasClient: !!client?.info,
    currentClientId,
    sessionId: SESSION_ID
  };
}

export { client };
