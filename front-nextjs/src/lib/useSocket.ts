// lib/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/utils/functions';

export function useSocket() {
  const socketRef = useRef<Socket>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(api('/'));
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado ao socket');
    });

    socket.on('qr', (qr: string) => {
      console.log('📲 Novo QR Code recebido');
      setQrCode(qr);
    });

    socket.on('ready', (status: boolean) => {
      setIsConnected(status);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, qrCode, isConnected };
}
