import express from 'express';
import { getClient } from '../whatsapp';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Número e mensagem obrigatórios' });
    }

    const client = getClient();

    if (!client.info) {
      return res.json({ message: 'Cliente não está conectado...' });
    }

    await client.sendMessage(`${to.includes('@') ? to : `${to}`}@c.us`, message);

    return res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;
