import express, { Request, Response } from 'express';
import { getClient } from '../whatsapp';
import { deleteRemoteAuthSession, destroyLocalClient } from '../../src/utils/functions';
import { SESSION_ID } from '../../env';

const router = express.Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const client = getClient();

    if (!client.info) {
      return res.json({ message: 'Cliente já está desconectado.' });
    }

    await destroyLocalClient();
    await deleteRemoteAuthSession(SESSION_ID);

    return res.json({ message: 'Cliente desconectado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    return res.status(500).json({ message: 'Erro ao desconectar.' });
  }
});

export default router;
