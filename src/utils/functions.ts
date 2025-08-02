import mongoose from 'mongoose';
import { Client, Message } from 'whatsapp-web.js';
import { PROPOSAL_OPTIONS, SERVICE_FORM } from "@/utils/consts";

const API_BASE_URL="http://localhost:3000"

const userStates = new Map<string, string>();

export async function deleteRemoteAuthSession(clientId: string) {
  const db = mongoose.connection.db;

  const base = `whatsapp-RemoteAuth-${clientId}`;

  try {
    const files = db?.collection(`${base}.files`);
    const chunks = db?.collection(`${base}.chunks`);

    const resultFiles = await files?.deleteMany({});
    const resultChunks = await chunks?.deleteMany({});

    console.log(`🗑 Sessão "${clientId}" removida com sucesso.`);
    console.log(`> arquivos: ${resultFiles?.deletedCount}, chunks: ${resultChunks?.deletedCount}`);
  } catch (err) {
    console.error('Erro ao apagar sessão manualmente:', err);
  }
}

export async function handleIncomingMessage(msg: Message, client: Client) {
  const number = msg.from;
  let serviceOption = "";

  const state = userStates.get(number);

  // Estado: aguardando resposta do formulário
  if (state === 'aguardando_formulario') {
    const MIN_LENGTH = 60;
    const content = msg.body.trim();

    if (content.length < MIN_LENGTH) {
      await msg.reply(
        "⚠️ Sua resposta parece estar incompleta.\n" +
        "Por favor, envie todas as informações solicitadas no formato texto.\n\n" +
        SERVICE_FORM.join('\n')
      );
      return;
    }

    // PATCH: atualiza o contato com o formulário completo
    try {
      await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { phone: number, 
            form: content, 
            status: "aguardando_tarefa", 
            service: serviceOption
          }
        ),
      });
    } catch (err) {
      console.error("Erro ao atualizar contato", err);
    }

    await msg.reply("✅ Obrigado pelas informações! Enviaremos sua proposta em breve.");
    userStates.delete(number);
    return;
  }

  // Primeira mensagem ou qualquer outra
  if (!state) {
    const optionList = PROPOSAL_OPTIONS.map((opt, i) => `${i + 1} - ${opt}`).join('\n');
    const contact = await msg.getContact();
    const name = contact.pushname || contact.name || '';
    let isOldContact = false;

    try {
      const contact = await fetch(`${API_BASE_URL}/api/contacts?phone=${number}`, {
        method: 'GET',
      });
      const contactData = await contact.json();
      isOldContact = contactData && contactData.phone === number;
    } catch (err) {
      console.error("Erro ao criar contato:", err);
    }

    if (isOldContact) {
      userStates.set(number, 'contato_duplicado');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappName: name,
          phone: number,
          status: "primeiro_contato"
        }),
      });
    } catch (err) {
      console.error("Erro ao criar contato:", err);
    }

    await client.sendMessage(msg.from,
      `Olá! A GeoView agradece seu contato.\nComo podemos te ajudar hoje?\n\n${optionList}`
    );
    userStates.set(number, 'aguardando_opcao');
    return;
  }

  // Estado: aguardando seleção de opção
  if (state === 'aguardando_opcao') {
    const index = parseInt(msg.body.trim()) - 1;
    const isValid = index >= 0 && index < PROPOSAL_OPTIONS.length;

    const selectedOption = isValid ? PROPOSAL_OPTIONS[index] : msg.body.trim();

    if (!isValid && !PROPOSAL_OPTIONS.includes(selectedOption)) {
      await msg.reply("Opção inválida. Por favor, escolha uma das opções enviadas anteriormente.");
      serviceOption = selectedOption;
      return;
    }

    await msg.reply(
      `Perfeito! Entendemos que você gostaria de um serviço de *${selectedOption}*.\n\n` +
      `Para seguirmos com sua solicitação e te enviarmos a proposta técnico-comercial, precisamos que nos envie as seguintes informações:\n\n` +
      SERVICE_FORM.join('\n')
    );

    userStates.set(number, 'aguardando_formulario');
    return;
  }

  if(state === 'contato_duplicado') {
    return;
  }
}
