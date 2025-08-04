// routes/createTask.ts
import express, { Request, Response } from "express";
import { MONDAY_API_TOKEN } from "../../env";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { taskName, columnValues, boardId, groupId } = req.body;

  if (!taskName) {
    return res.status(400).json({ message: "O nome da tarefa é obrigatório." });
  }

  try {
    // Serializar os columnValues se existirem
    const serializedColumns = columnValues
      ? `, column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"`
      : "";

    const query = `
      mutation {
        create_item (
          board_id: ${boardId},
          group_id: "${groupId}",
          item_name: "${taskName}"${serializedColumns}
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
    const itemId = data?.data?.create_item?.id;

    if (itemId) {
      return res.status(200).json({
        success: true,
        itemId,
        message: "Tarefa criada com sucesso no Monday.com.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Erro ao criar tarefa. Verifique os dados.",
        response: data,
      });
    }
  } catch (error: any) {
    console.error("Erro ao criar tarefa:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar tarefa no Monday.com.",
    });
  }
});

export default router;
