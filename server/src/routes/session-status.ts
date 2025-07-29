import express from 'express';
import { getClient } from '../whatsapp';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const client = getClient();
    const state = await client.getState();

    const isConnected = state === 'CONNECTED';

    return res.json({
      connected: isConnected,
      state, // Ex: 'CONNECTED', 'PAIRING', etc.
    });
  } catch (err) {
    console.error('Erro ao obter status da sessão:', err);
    return res.json({
      connected: false,
      state: 'DISCONNECTED',
    });
  }
});

export default router;
