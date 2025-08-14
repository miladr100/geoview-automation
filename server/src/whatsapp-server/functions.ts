import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { getClient, deleteClient } from './whatsapp';
import { Client, Message } from 'whatsapp-web.js';
import { MESSAGE_PORT, WHATSAPP_PORT, SESSION_ID } from '../../env';

const SESSION_AUTH_FOLDER = '.wwebjs_auth';
const SESSION_CASH_FOLDER = '.wwebjs_cache';

// Função para gerar ID único baseado no timestamp
// Formato: SESSION_ID_TIMESTAMP_SUFFIX_ALEATORIO
// Exemplo: "geoview_1703123456789_a1b2c3"
export function generateUniqueClientId(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8); // 6 caracteres aleatórios
  return `${SESSION_ID}_${timestamp}_${randomSuffix}`;
}

// Função para limpar sessões antigas (opcional)
export async function cleanupOldSessions(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    
    // Lista todas as collections do banco
    const collections = await db.listCollections().toArray();
    
    // Filtra collections que seguem o padrão do WhatsApp Web.js
    const whatsappCollections = collections.filter(collection => 
      collection.name.startsWith('whatsapp-RemoteAuth-') && 
      (collection.name.endsWith('.chunks') || collection.name.endsWith('.files'))
    );
    
    // Agrupa por clientId (remove .chunks e .files)
    const clientIds = new Set<string>();
    whatsappCollections.forEach(collection => {
      const baseName = collection.name.replace('.chunks', '').replace('.files', '');
      if (baseName.startsWith('whatsapp-RemoteAuth-')) {
        const clientId = baseName.replace('whatsapp-RemoteAuth-', '');
        // Verifica se o clientId segue o padrão SESSION_ID_TIMESTAMP_SUFFIX
        if (clientId.match(new RegExp(`^${SESSION_ID}_\\d+_\\w+$`))) {
          clientIds.add(clientId);
        }
      }
    });
    
    if (clientIds.size > 0) {
      console.log(`🧹 Encontradas ${clientIds.size} sessões do WhatsApp para verificação...`);
      
      // Para cada clientId, verifica se é antigo (mais de 24 horas)
      const oldTimestamp = Date.now() - (24 * 60 * 60 * 1000);
      const oldClientIds: string[] = [];
      
      for (const clientId of clientIds) {
        // Extrai o timestamp do clientId (formato: SESSION_ID_TIMESTAMP_SUFFIX)
        const parts = clientId.split('_');
        if (parts.length >= 2) {
          const timestamp = parseInt(parts[1]);
          if (timestamp && timestamp < oldTimestamp) {
            oldClientIds.push(clientId);
          }
        }
      }
      
      if (oldClientIds.length > 0) {
        console.log(`🧹 Limpando ${oldClientIds.length} sessões antigas...`);
        for (const clientId of oldClientIds) {
          await deleteRemoteAuthSessionByClientId(clientId);
        }
        console.log(`✅ Limpeza de sessões antigas concluída`);
      } else {
        console.log(`✅ Nenhuma sessão antiga encontrada para limpeza`);
      }
    } else {
      console.log(`✅ Nenhuma sessão do WhatsApp encontrada para limpeza`);
    }
  } catch (error) {
    console.error('❌ Erro ao limpar sessões antigas:', error);
  }
}

export async function deleteRemoteAuthSessionByClientId(clientId: string) {
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

  try {
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
  } catch (error) {
    console.error('❌ Erro ao limpar sessões locais:', error);
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

export async function handleProcessMessage(msg: Message, client: Client) {
  // ✅ Ignora mensagens que não sejam de contatos diretos (ex: grupos, status, broadcast)
  if (!msg.from.endsWith('@c.us')) {
    console.log(`📵 Mensagem ignorada de ${msg.from}`);
    return;
  }

  if (msg.type !== 'chat') {
    console.log(`📵 Mensagem não suportada recebida de ${msg.from}: ${msg.type}`);
  } else {
    console.log(`📩 Mensagem recebida de ${msg.from}`);
  }
  
  const contact = await msg.getContact();
  const name = contact?.pushname || contact?.name || 'Desconhecido';
  const body = msg.type === 'chat' ? msg.body : "-";

  // Envia mensagem para o message-server processar
  try {
    const response = await fetch(`http://localhost:${MESSAGE_PORT}/api/process-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: msg.from,
        body,
        type: msg.type,
        name,
        messageId: msg.id._serialized,
        // Adiciona callback URL para resposta
        callbackUrl: `http://localhost:${WHATSAPP_PORT}/api/send-response`
      })
    });

    if (!response.ok) {
      console.error('❌ Erro ao processar mensagem no message-server');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para processamento:', error);
  }
}