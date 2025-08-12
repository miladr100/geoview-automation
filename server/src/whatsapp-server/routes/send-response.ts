import express from 'express';
import { getClient } from '../whatsapp';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { to, message, messageId, type = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Destinatário e mensagem obrigatórios' });
    }

    const client = getClient();

    if (!client.info) {
      return res.status(503).json({ error: 'Cliente WhatsApp não está conectado' });
    }

    let response;
    
    if (messageId && type === 'reply') {
      // Resposta direta usando msg.reply
      // Aqui precisamos encontrar a mensagem original
      const chat = await client.getChatById(to);
      const messages = await chat.fetchMessages({ limit: 10 });
      const originalMessage = messages.find(m => m.id._serialized === messageId);
      
      if (originalMessage) {
        response = await originalMessage.reply(message);
      } else {
        // Fallback para mensagem normal se não encontrar a original
        response = await client.sendMessage(to, message);
      }
    } else {
      // Mensagem normal
      response = await client.sendMessage(to, message);
    }

    return res.json({ 
      success: true, 
      messageId: response.id._serialized,
      message: 'Mensagem enviada com sucesso' 
    });
  } catch (err) {
    console.error('Erro ao enviar resposta:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;