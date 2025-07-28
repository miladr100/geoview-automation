// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { WHATSAPP_STATES } from "@/utils/consts";
import './page.css';

export default function Home() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'waiting' | 'disconnected' | 'reconnecting' | 'uninitialized' | 'loading'>('loading');
  const [message, setMessage] = useState({ number: "55", message: "" });
  const [isUserDisconnection, setIsUserDisconnection] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    const socket = io();

    fetch('/api/session-status')
      .then(res => res.json())
      .then(data => {
        const state = data.state;

        if (state === WHATSAPP_STATES.CONNECTED) {
          setStatus('connected');
        } else if (
          state === WHATSAPP_STATES.UNPAIRED ||
          state === WHATSAPP_STATES.UNPAIRED_IDLE ||
          state === WHATSAPP_STATES.PAIRING
        ) {
          setStatus('waiting'); // aguardando login via QR
        } else if (
          state === WHATSAPP_STATES.OPENING ||
          state === WHATSAPP_STATES.CONFLICT
        ) {
          setStatus('loading');
        } else {
          setStatus('disconnected');
          if (!isUserDisconnection) tryReconnect();
        }
      })
      .catch(() => {
        setStatus('disconnected');
      });

    socket.on('qr', (qr: string) => {
      setQrCode(qr);
      setStatus('waiting');
    });

    socket.on('ready', (status: boolean) => {
      setStatus(status ? 'connected' : 'disconnected');
      if (status) setQrCode(null);
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      if (!isUserDisconnection) tryReconnect();
    });

    socket.on('uninitialized', () => {
      setStatus('uninitialized');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function tryReconnect() {
    const MAX_ATTEMPTS = 6;
    const INTERVAL_MS = 10000;

    if (!isReconnecting) {
      setIsReconnecting(true);
      const res = await fetch('/api/check-session', { method: 'POST' });
      const data = await res.json();
      if (data.session) {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          console.log(`🔄 Tentativa de reconexão ${attempt}/${MAX_ATTEMPTS}...`);

          try {
            const res = await fetch('/api/generate-qr', { method: 'POST' });
            console.log(res)

            if (res.ok) {
              console.log("✅ Tentativa de reconexão bem-sucedida!");
              setStatus('reconnecting');
              setIsReconnecting(false)
              return;
            } else {
              console.warn(`❌ Falha na tentativa ${attempt}`);
            }
          } catch (error) {
            setIsReconnecting(false)
            console.error(`⚠️ Erro na tentativa ${attempt}:`, error);
          }

          if (attempt < MAX_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
          } else {
            setIsReconnecting(false)
          }
        }
        console.error("🛑 Não foi possível reconectar após 1 minuto.");
      }
      setIsReconnecting(false);
    }
  }

  const handleSendTest = async () => {
    alert(`Enviando mensagem: \n${message.message}`);
    const body = JSON.stringify({ to: message.number, message: message.message })
    const res = await fetch("/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    alert(`Resposta do Servidor: \n${res.ok ? "Sucesso" : "Falhou"}`);
  };

  const handleDisconnect = async () => {
    const res = await fetch('/api/disconnect', { method: 'POST' });
    alert(`Resposta do Servidor: \n${res.ok ? "Sucesso" : "Falhou"}`);
    if (res.ok) {
      setIsUserDisconnection(true);
      setStatus('disconnected');
    }
  };

  const handleGenerateQR = async () => {
    setLoadingQR(true);
    try {
      const res = await fetch('/api/generate-qr', { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao gerar QR Code.');
      setStatus('uninitialized');
    } catch (error) {
      alert('Erro ao gerar QR Code.');
    } finally {
      setLoadingQR(false);
    }
  };

  const statusClass = {
    connected: 'status-connected',
    waiting: 'status-waiting',
    disconnected: 'status-disconnected',
    uninitialized: 'uninitialized',
    reconnecting: 'reconnecting',
    loading: 'loading',
  }[status];

  return (
    <div className="container">
      <h1 className="title">GeoView Conexão com WhatsApp</h1>

      <div className={`status ${statusClass}`}>
        {status === 'loading' && '⌛ Carregando...'}
        {status === 'connected' && '✅ Conectado'}
        {status === 'waiting' && '🕒 Escaneie o QR para conectar...'}
        {status === 'reconnecting' && '🕒 Reconectando, aguarde...'}
        {status === 'uninitialized' && '⌛ Gerando QR Code...'}
        {status === 'disconnected' && '❌ Desconectado'}
      </div>

      <div className="button-group">
        {status === 'connected' &&
          <button onClick={handleDisconnect} className="button red">
            Desconectar
          </button>
        }
        {status === 'disconnected' &&
          <button
            onClick={handleGenerateQR}
            className={loadingQR ? "button gray" : "button blue"}
            disabled={loadingQR}
          >
            {loadingQR ? 'Carregando QR Code...' : 'Gerar QR Code'}
          </button>
        }
      </div>

      {qrCode && (
        <div className="qrcode-box">
          <p>Escaneie o QR Code abaixo:</p>
          <img src={qrCode} alt="QR Code" className="qrcode" />
        </div>
      )}

      {status === 'connected' && (
        <div className="form">
          <input
            value={message.number}
            onChange={(e) => setMessage({ number: e.target.value, message: message.message })}
            placeholder="Número"
            className="input"
          />
          <textarea
            value={message.message}
            onChange={(e) => setMessage({ number: message.number, message: e.target.value })}
            placeholder="Mensagem de teste"
            className="textarea"
          />
          <button onClick={handleSendTest} className="button green">
            Enviar Mensagem de Teste
          </button>
        </div>
      )}
    </div>
  );
}
