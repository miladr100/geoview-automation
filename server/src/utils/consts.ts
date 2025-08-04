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

export const BOARD_CODES = {
  "GPR": {
    id: 891902277,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Locação GPR_IE": {
    id: 1531023227,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Geoelétrica": {
    id: 890896058,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Sísmica - MASW": {
    id: 1476354654,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Geofísica Geral": {
    id: 1750329516,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Perfilagem Geofísica": {
    id: 4608209516,
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Perfilagem Ótica": {
    id: 4608206775,
    group: {
      id: "topics",
      title: "Propostas a fazer"
    },
  },
  "Topografia Geofísica": {
    id: 5501203736,
    group: {
      id: "topics",
      title: "Propostas a fazer"
    },
  },
  "Licitação": {
    id: 4810781529,
    group: {
      id: "novo_grupo",
      title: "Licitações a fazer"
    },
  },
};

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