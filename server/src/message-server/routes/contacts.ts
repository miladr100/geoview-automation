import express, { Request, Response } from "express";
import { ClientContactRepository } from "../../repositories/clientContactRepository";
import { ClientContactSchema } from "../../schemas/ClientContactSchema";
import { ZodError } from "zod";

const router = express.Router();
const clientContactRepository = new ClientContactRepository();

// GET /api/contacts
router.get("/", async (req: Request, res: Response) => {
  const all = req.query.all === "true";
  const phone = (req.query.phone as string) || "";

  try {
    if (all) {
      const allClientContacts = await clientContactRepository.listAllContacts();
      return res.json(allClientContacts);
    }

    const clientContact = await clientContactRepository.findContactByPhoneNumber(phone);
    return res.json(clientContact);
  } catch (err) {
    console.error("Erro interno no GET /contacts:", err);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// POST /api/contacts
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = ClientContactSchema.omit({ _id: true, createdAt: true }).parse(req.body);
    const created = await clientContactRepository.insertNewContact(parsed);
    return res.status(201).json(created);
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

// PATCH /api/contacts
router.patch("/", async (req: Request, res: Response) => {
  try {
    const { phone, ...updateData } = req.body;

    const result = await clientContactRepository.updateContactByPhone(phone || "", updateData);

    if (result.matchedCount === 0) {
      const parsed = ClientContactSchema.omit({ _id: true, createdAt: true }).parse(req.body);
      const created = await clientContactRepository.insertNewContact(parsed);
      return res.status(201).json(created);
    }

    return res.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "Erro de validação",
        issues: err.flatten(),
      });
    }

    console.error("Erro inesperado no PATCH:", err);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// DELETE /api/contacts/:phone
router.delete("/", async (req: Request, res: Response) => {
  const phone = (req.query.phone as string) || "";

  if (!phone) {
    return res.status(400).json({ success: false, error: "Parâmetro 'phone' é obrigatório." });
  }

  try {
    const result = await clientContactRepository.deleteContactByPhoneNumber(phone);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Contato não encontrado." });
    }

    return res.json({ success: true, message: "Contato removido com sucesso.", phone });
  } catch (err) {
    console.error("Erro ao deletar contato:", err);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

export default router;
