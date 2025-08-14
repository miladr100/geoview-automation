import express from 'express';
import { processIncomingMessage } from '../utils/functions';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { from, body, name, messageId, callbackUrl, type } = req.body;

    if (!from || !body || !name || !callbackUrl || !messageId) {
      return res.status(400).json({ error: 'Dados obrigatórios: from, body, name, callbackUrl, messageId' });
    }
    console.log("Mensagem recebida para processamento: ", from);
    // Processa a mensagem de forma assíncrona
    processIncomingMessage(from, body, name, type, messageId, callbackUrl);

    // Responde imediatamente para não bloquear o WhatsApp
    return res.json({ 
      success: true, 
      message: 'Mensagem recebida para processamento' 
    });
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;