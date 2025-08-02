// routes/checkSession.ts
import express, { Request, Response } from "express";
import mongoose from 'mongoose';
import { SESSION_ID, MONGO_URL } from '../../env';

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URL);
    }

    const db = mongoose.connection.db;
    const filesCollection = db?.collection(`whatsapp-RemoteAuth-${SESSION_ID}.files`);
    const fileCount = await filesCollection?.countDocuments();

    if (!fileCount || fileCount === 0) {
      return res.status(200).json({
        session: false,
        message: 'Nenhuma sessão encontrada.',
      });
    }

    return res.status(200).json({
      session: true,
      message: 'Sessão encontrada.',
    });
  } catch (error) {
    console.error('Erro ao tentar reconectar:', error);
    return res.status(500).json({
      session: false,
      message: 'Erro ao tentar reconectar.',
    });
  }
});

export default router;
