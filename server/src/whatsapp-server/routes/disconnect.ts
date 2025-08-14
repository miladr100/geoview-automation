import express from 'express';
import { deleteRemoteAuthSessionByClientId, destroyLocalClient } from '../functions';
import { SESSION_ID } from '../../../env';
import { getCurrentClientId } from '../whatsapp';

const router = express.Router();

router.post('/', async (_req, res) => {
  try {
    const currentClientId = getCurrentClientId();
    
    if (currentClientId) {
      await deleteRemoteAuthSessionByClientId(currentClientId);
    } else {
      // Fallback para SESSION_ID se não houver clientId atual
      await deleteRemoteAuthSessionByClientId(SESSION_ID);
    }
    
    await destroyLocalClient();
    
    return res.json({ 
      success: true, 
      message: 'WhatsApp desconectado com sucesso' 
    });
  } catch (err) {
    console.error('Erro ao desconectar WhatsApp:', err);
    return res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
  }
});

export default router;
