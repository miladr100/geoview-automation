import { Client, Message } from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { getClient, deleteClient } from '../whatsapp';
import { PROPOSAL_OPTIONS, SERVICE_FORM, BOARD_CODES } from "./consts";
import { userStates, userServiceMap } from "./states";
import { PORT } from '../../env';

const API_BASE_URL = `http://localhost:${PORT}`

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

export async function destroyLocalClient() {
  const client = getClient();

  await client.destroy();

  const store = (client as any).authStrategy?.store;
  if (store && typeof store.delete === 'function') {
    deleteClient();
  }
}

async function createMondayTask(name: string, boardId: number, groupId: string, boardCode: string) {
  const date = new Date();
  const year = date.getFullYear();
  const shortYear = year.toString().slice(-2);
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-monday-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskName: `GEOV0000-${shortYear}.${name}.${boardCode}`,
        boardId,
        groupId
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao criar tarefa no Monday:", error);
    return { success: false, message: "Erro ao criar tarefa no Monday." };
  }
}

async function createMondayTaskComment(phone: string, name: string, form: string, itemId: number) {
  const data = new Date();
  const beautifiedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
    hour12: false,
  }).format(data);
  const comment = `Proposta enviada por ${name} (${phone})\n\nData: ${beautifiedDate}\n\n${form}`;
  try {
    const response = await fetch(`${API_BASE_URL}/api/add-monday-comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        description: comment
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return { success: false, message: "Erro ao adicionar comentário." };
  }
}

async function handleMondayNewTask(phone: string, name: string, form: string, task: string) {
  const boardItem = BOARD_CODES[task];
  if (!boardItem) {
    console.error(`Erro: quadro inválido ${task}`);
    return;
  }
  const formattedPhone = phone.replace(/\D/g, '');
  const taskResponse = await createMondayTask(name, boardItem.id, boardItem.group.id, boardItem.code);

  if (taskResponse.success) {
    console.log("Tarefa criada com sucesso no Monday.");
    const commentResponse = await createMondayTaskComment(formattedPhone, name, form, taskResponse.itemId);
    if (commentResponse.success) {
      console.log("Comentário criado com sucesso no Monday.");
    } else {
      console.error("Erro ao adicionar comentário:", commentResponse.message);
    }

    try {
      await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            phone: phone,
            boardId: taskResponse.itemId,
            groupId: commentResponse.updateId,
          }
        ),
      });
    } catch (err) {
      console.error("Erro ao atualizar contato", err);
    }
  } else {
    console.error("Erro ao criar tarefa:", taskResponse.message);
  }
}

async function createNewContact(name: string, number: string) {
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
}

async function updateContact(number: string, content: string, service: string) {
  try {
    await fetch(`${API_BASE_URL}/api/contacts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        {
          phone: number,
          form: content,
          status: "aguardando_tarefa",
          service,
        }
      ),
    });
  } catch (err) {
    console.error("Erro ao atualizar contato", err);
  }
}

export async function handleIncomingMessage(msg: Message, client: Client) {
  const number = msg.from;

  const state = userStates.get(number);

  // Estado: aguardando resposta do formulário
  if (state === 'aguardando_formulario') {
    const MIN_LENGTH = 60;
    const content = msg.body.trim();
    const contact = await msg.getContact();
    const name = contact.pushname || contact.name || '';

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
    updateContact(number, content, service);

    await msg.reply("✅ Obrigado pelas informações! Enviaremos sua proposta em breve.");
    console.log("Mensagem recebida, estado atribuido: aguardando_tarefa");

    await handleMondayNewTask(number, name, content, service);
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

      if (!contactData?.service) {
        console.log("Estado recuperado: aguardando_opcao");
        userStates.set(number, 'aguardando_opcao');
        handleIncomingMessage(msg, client);
        return;
      };

      if (!contactData?.form) {
        console.log("Estado recuperado: aguardando_formulario");
        userStates.set(number, 'aguardando_formulario');
        handleIncomingMessage(msg, client);
        return;
      };

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
    await createNewContact(name, number);

    await client.sendMessage(msg.from,
      `Olá! A GeoView agradece seu contato.\nMeu nome é Henrique de Sá, gerente de projetos da GeoView.\n\nEscolha o serviço que deseja hoje:\n\n${optionList}`
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

  if (state === 'contato_duplicado') {
    return;
  }
}