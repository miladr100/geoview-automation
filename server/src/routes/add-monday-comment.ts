// routes/addComment.ts
import express, { Request, Response } from "express";
import { MONDAY_API_TOKEN } from "../../env";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    const { itemId, description } = req.body;

    if (!itemId || !description) {
        return res.status(400).json({
            success: false,
            message: "É necessário informar o itemId e a descrição.",
        });
    }

    const escapedDescription = description
        .replace(/\\/g, '\\\\')      // escapa barras
        .replace(/"/g, '\\"')        // escapa aspas
        .replace(/\n/g, '\\n');      // escapa quebras de linha

    try {
        const query = `
            mutation {
                create_update (
                item_id: ${itemId},
                body: "${escapedDescription}"
                ) {
                id
                }
            }
        `;

        const response = await fetch("https://api.monday.com/v2", {
            method: "POST",
            headers: {
                Authorization: MONDAY_API_TOKEN,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();

        const updateId = data?.data?.create_update?.id;

        if (updateId) {
            return res.status(200).json({
                success: true,
                updateId,
                message: "Comentário adicionado com sucesso.",
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Falha ao adicionar comentário.",
                response: data,
            });
        }
    } catch (error: any) {
        console.error("Erro ao adicionar comentário na tarefa do monday:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno ao tentar adicionar o comentário.",
        });
    }
});

export default router;
