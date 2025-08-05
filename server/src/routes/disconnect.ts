import express, { Request, Response } from 'express';
import { getClient, deleteClient } from '../whatsapp';
import { deleteLocalAuthSession } from '../../src/utils/functions';
//import { SESSION_ID } from '../../env';

const router = express.Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const client = getClient();

    if (!client.info) {
      return res.json({ message: 'Cliente já está desconectado.' });
    }

    await client.destroy();
    console.log('✅ client.destroy() executado');

    const store = (client as any).authStrategy?.store;
    if (store && typeof store.delete === 'function') {
      //await deleteRemoteAuthSession(SESSION_ID);
      setTimeout(() => {
        deleteLocalAuthSession();
        deleteClient();
      }, 1000); // 500ms de espera
    }

    return res.json({ message: 'Cliente desconectado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    return res.status(500).json({ message: 'Erro ao desconectar.' });
  }
});

export default router;
