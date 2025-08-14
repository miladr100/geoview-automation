import { IClientContact } from '../../models/ClientContact';
import { PROPOSAL_OPTIONS, SERVICE_FORM, BOARD_CODES } from "./consts";
import { MESSAGE_PORT } from '../../../env';

const API_BASE_URL = `http://localhost:${MESSAGE_PORT}`

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
        status: "aguardando_opcao"
      }),
    });
  } catch (err) {
    console.error("Erro ao criar contato:", err);
  }
}

async function updateContact(number: string, content: string, service: string, status: string) {
  try {
    await fetch(`${API_BASE_URL}/api/contacts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        {
          phone: number,
          form: content,
          status,
          service,
        }
      ),
    });
  } catch (err) {
    console.error("Erro ao atualizar contato", err);
  }
}

export async function processMessageAndGenerateResponse(
  number: string,
  body: string,
  name: string,
  currentState: string | null,
  clientContact: IClientContact | null
) {
  const content = body.trim();
  const whatsappName = clientContact?.whatsappName || name;
  const service = clientContact?.service || null;
  const optionList = PROPOSAL_OPTIONS.map((opt, i) => `${i + 1} - ${opt}`).join('\n');

  // Primeira mensagem
  if (!currentState) {
    console.log("Mensagem de primeiro contato recebida, estado atribuido: aguardando_opcao");
    await createNewContact(whatsappName, number);

    return {
      to: number,
      message: `Olá! A GeoView agradece seu contato.\nMeu nome é Henrique de Sá, gerente de projetos da GeoView.\n\nEscolha o serviço que deseja hoje:\n\n${optionList}`,
      type: 'text'
    };
  }

  // Estado: aguardando seleção de opção
  if (currentState === 'aguardando_opcao') {
    const index = parseInt(content) - 1;
    const isValid = index >= 0 && index < PROPOSAL_OPTIONS.length;

    const selectedOption = isValid ? PROPOSAL_OPTIONS[index] : content;
    if (!isValid && !PROPOSAL_OPTIONS.includes(selectedOption)) {
      return {
        to: number,
        message: `Opção inválida. Por favor, escolha uma das opções enviadas anteriormente.\n\n${optionList}`,
        type: 'reply'
      };
    }

    // PATCH: atualiza o contato com o formulário completo
    updateContact(number, null, selectedOption, 'aguardando_formulario');
    console.log("Estado atribuido: aguardando_formulario");

    return {
      to: number,
      message: `Perfeito! Entendemos que você gostaria de um serviço de *${selectedOption}*.\n\n` +
        `Para seguirmos com sua solicitação e te enviarmos a proposta técnico-comercial, precisamos que nos envie as seguintes informações:\n\n` +
        SERVICE_FORM.join('\n'),
      type: 'reply'
    };
  }

  // Estado: aguardando resposta do formulário
  if (currentState === 'aguardando_formulario') {
    const MIN_LENGTH = 60;

    if (content.length < MIN_LENGTH) {
      return {
        to: number,
        message: "⚠️ Sua resposta parece estar incompleta.\n" +
          "Por favor, envie todas as informações solicitadas no formato texto.\n\n" +
          SERVICE_FORM.join('\n'),
        type: 'reply'
      };
    }

    // PATCH: atualiza o contato no banco de dados com o formulário completo
    updateContact(number, content, service, 'aguardando_tarefa');
    console.log("Estado atribuido: aguardando_tarefa");

    // Cria a tarefa no Monday
    await handleMondayNewTask(number, whatsappName, content, service);

    return {
      to: number,
      message: "✅ Obrigado pelas informações! Enviaremos sua proposta em breve.",
      type: 'text'
    };
  }

  // Estado: contato duplicado
  if (currentState === 'contato_duplicado') {
    console.log("Estado atribuido: contato_duplicado");
    return;
  }
}

async function sendResponseToWhatsApp(callbackUrl: string, response: {
  to: string;
  message: string;
  type: string;
  messageId: string;
}) {
  try {
    await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
  } catch (error) {
    console.error('Erro ao enviar resposta para WhatsApp:', error);
  }
}

export async function processIncomingMessage(
  from: string,
  body: string,
  name: string,
  type: string,
  messageId: string,
  callbackUrl: string
) {
  let contactData: IClientContact | null = null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/contacts?phone=${from}`);
    contactData = await response.json();
  } catch (err) {
    console.error("Erro ao buscar contato:", err);
    return;
  }

  if (contactData?.block) {
    console.log("Contato bloqueado, ignorando mensagem.");
    return;
  }

  let currentState: string | null = null;
  if (!contactData || !contactData.phone) {
    currentState = null;
    console.log("Estado recebido: primeiro_contato");
  } else if (!contactData.service && !contactData.form) {
    currentState = 'aguardando_opcao';
    console.log("Estado recebido: aguardando_opcao");
  } else if (contactData.service && !contactData.form) {
    currentState = 'aguardando_formulario';
    console.log("Estado recebido: aguardando_formulario");
  } else {
    currentState = 'contato_duplicado';
    console.log("Estado recebido: contato_duplicado");
  }

  let processedResponse: {
    to: string;
    message: string;
    type: string;
  } | null = null;

  // ✅ Verifica se a mensagem é do tipo suportado
  if (type !== 'chat') {  
    console.log(`📵 Mensagem não suportada recebida de ${from}: ${type}`);
    processedResponse = {
      to: from,
      message: 'Desculpe, não consigo processar este tipo de mensagem. Por favor, envie apenas mensagens de texto.',
      type: 'text',
    };
  } else {
    // Processa a mensagem e gera resposta
    processedResponse = await processMessageAndGenerateResponse(from, body, name, currentState, contactData);
  }


  // Envia resposta de volta para o whatsapp-server
  if (processedResponse) {
    await sendResponseToWhatsApp(callbackUrl, {
      ...processedResponse,
      messageId,
    });
  }
}