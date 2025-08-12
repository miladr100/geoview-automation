export const PROPOSAL_OPTIONS = [
  "Georadar (GPR)",
  "Locação de Georadar (GPR)",
  "Geoelétrica",
  "Sísmica - MASW",
  "Geofísica Geral",
  "Perfilagem Geofísica",
  "Perfilagem Ótica",
  "Topografia Geofísica",
];

export const BOARD_CODES = {
  "Georadar (GPR)": {
    id: 891902277,
    code: "GPR",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Locação de Georadar (GPR)": {
    id: 1531023227,
    code: "LOC GPR",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Geoelétrica": {
    id: 890896058,
    code: "IE geral",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Sísmica - MASW": {
    id: 1476354654,
    code: "SIS",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Geofísica Geral": {
    id: 1750329516,
    code: "GEO Geral",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Perfilagem Geofísica": {
    id: 4608209516,
    code: "PERF GEOF",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Perfilagem Ótica": {
    id: 4608206775,
    code: "Perfilagem Ótica",
    group: {
      id: "novo_grupo",
      title: "Propostas a fazer"
    },
  },
  "Topografia Geofísica": {
    id: 5501203736,
    code: "TOP",
    group: {
      id: "topics",
      title: "Propostas a fazer"
    },
  },
};

export const SERVICE_FORM = [
  "1. Nome do solicitante:",
  "2. Empresa (caso exista):",
  "3. Email:",
  "4. Telefone de contato:",
  "5. Local do serviço:",
  "6. Tamanho da área de pesquisa:",
  "7. Previsão de realização do serviço:",
  "8. Observações:"
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