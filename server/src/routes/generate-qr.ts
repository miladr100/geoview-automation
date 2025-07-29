import express from 'express';
import { initWhatsApp } from '../whatsapp';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await initWhatsApp(); // sem socketServer, usa o global já inicializado
    res.json({ message: 'Gerando novo QR Code...' });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ message: 'Erro ao gerar QR Code.' });
  }
});

export default router;
