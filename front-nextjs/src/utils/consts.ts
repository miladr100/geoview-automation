export const PROPOSAL_OPTIONS = [
  "GPR",
  "Locação GPR_IE",
  "Geoelétrica",
  "Sísmica - MASW",
  "Geofísica Geral",
  "Perfilagem Geofísica",
  "Perfilagem Ótica",
  "Topografia Geofísica",
  "Licitação"
];

export const SERVICE_FORM = [
  "1. Tipo de serviço:",
  "2. Nome do solicitante:",
  "3. Empresa (caso exista):",
  "4. Email:",
  "5. Telefone de contato:",
  "6. Local do serviço:",
  "7. Tamanho da área de pesquisa:",
  "8. Previsão de realização do serviço:",
  "9. Observações:"
];

export const WHATSAPP_STATES = {
  CONNECTED: 'CONNECTED',
  OPENING: 'OPENING',
  PAIRING: 'PAIRING',
  UNPAIRED: 'UNPAIRED',
  UNPAIRED_IDLE: 'UNPAIRED_IDLE',
  CONFLICT: 'CONFLICT',
  TIMEOUT: 'TIMEOUT',
  DEPRECATED_VERSION: 'DEPRECATED_VERSION',
} as const;

export const USER_MESSAGE_STATES = {
  primeiro_contato: "primeiro_contato",
  aguardando_formulario: "aguardando_formulario",
  aguardando_opcao: "aguardando_opcao"
}

export const SESSION_ID = 'geoview';
export const MONGO_URL = "mongodb+srv://miladr100:29051997pc@whatsjs-bot.v2qutgh.mongodb.net/";
