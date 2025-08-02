import { Client, Message } from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { PROPOSAL_OPTIONS, SERVICE_FORM } from "./consts";
import { userStates, userServiceMap } from "./states";
import { PORT } from '../../env';

const API_BASE_URL=`http://localhost:${PORT}`

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

    const service = userServiceMap.get(number) ?? null;

    // PATCH: atualiza o contato com o formulário completo
    try {
      await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { phone: number, 
            form: content, 
            status: "aguardando_tarefa", 
            service,
          }
        ),
      });
    } catch (err) {
      console.error("Erro ao atualizar contato", err);
    }

    await msg.reply("✅ Obrigado pelas informações! Enviaremos sua proposta em breve.");
    console.log("Mensagem recebida, estado atribuido: aguardando_tarefa");
    userStates.delete(number);
    userServiceMap.delete(number);
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
      console.log("Mensagem recebida, estado atribuido: contato_duplicado");
      return;
    }

    console.log("Mensagem recebida, estado atribuido: primeiro_contato");
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
    console.log("Mensagem recebida, estado atribuido: aguardando_opcao");
    return;
  }

  // Estado: aguardando seleção de opção
  if (state === 'aguardando_opcao') {
    const index = parseInt(msg.body.trim()) - 1;
    const isValid = index >= 0 && index < PROPOSAL_OPTIONS.length;

    const selectedOption = isValid ? PROPOSAL_OPTIONS[index] : msg.body.trim();
    if (!isValid && !PROPOSAL_OPTIONS.includes(selectedOption)) {
      await msg.reply("Opção inválida. Por favor, escolha uma das opções enviadas anteriormente.");
      return;
    }

    userServiceMap.set(number, selectedOption);

    await msg.reply(
      `Perfeito! Entendemos que você gostaria de um serviço de *${selectedOption}*.\n\n` +
      `Para seguirmos com sua solicitação e te enviarmos a proposta técnico-comercial, precisamos que nos envie as seguintes informações:\n\n` +
      SERVICE_FORM.join('\n')
    );

    userStates.set(number, 'aguardando_formulario');
    console.log("Mensagem recebida, estado atribuido: aguardando_formulario");
    return;
  }

  if(state === 'contato_duplicado') {
    return;
  }
}