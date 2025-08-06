export const api = (path: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    loading: '⌛ Carregando...',
    connected: '✅ Conectado',
    waiting: '🕒 Escaneie o QR para conectar...',
    reconnecting: '🕒 Reconectando, aguarde...',
    uninitialized: '⌛ Gerando QR Code...',
    disconnected: '❌ Desconectado'
  };
  return map[status] || 'Estado desconhecido';
};