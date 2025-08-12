import express, { Request, Response } from "express";
import { ZodError } from "zod";

const router = express.Router();
import { MESSAGE_PORT } from '../../../env';

const API_BASE_URL = `http://localhost:${MESSAGE_PORT}`

// POST /api/contacts
router.post("/", async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone obrigatório' });
    }

    const newContact = {
        phone,
        whatsappName: name || "Desconhecido",
        status: "bloqueado",
        block: true,
    };
    await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
    });

    console.log("Contato bloqueado com sucesso", phone);
    return res.json({ message: 'Contato bloqueado com sucesso', phone, whatsappName: name });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "Erro de validação",
        issues: err.flatten(),
      });
    }

    console.error("Erro inesperado ao criar contato:", err);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

export default router;