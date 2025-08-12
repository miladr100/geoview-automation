import express, { Request, Response } from 'express';
import { getClient } from '../whatsapp';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone obrigatório' });
    }

    const client = getClient();

    if (!client.info) {
      return res.status(503).json({ error: 'Cliente WhatsApp não está conectado' });
    }

    // Formata o número para o formato do WhatsApp
    const formattedPhone = phone.endsWith('@c.us') ? phone : `${phone}@c.us`;

    try {
      // Tenta obter informações do contato
      const contact = await client.getContactById(formattedPhone);
      
      if (contact) {
        const contactInfo = {
          exists: true,
          phone: formattedPhone,
          name: contact.pushname || contact.name || 'Sem nome',
          isBusiness: contact.isBusiness || false,
          isGroup: contact.isGroup || false,
          isWAContact: contact.isWAContact || false
        };

        return res.json({ 
          success: true, 
          contact: contactInfo 
        });
      } else {
        return res.json({ 
          success: true, 
          contact: { 
            exists: false, 
            phone: formattedPhone 
          } 
        });
      }
    } catch (contactError) {
      // Se não conseguir obter o contato, provavelmente não existe
      return res.json({ 
        success: true, 
        contact: { 
          exists: false, 
          phone: formattedPhone,
          error: 'Contato não encontrado no WhatsApp'
        } 
      });
    }

  } catch (err) {
    console.error('Erro ao verificar número:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
