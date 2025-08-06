// app/page.tsx
'use client';

import io from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';
import { WHATSAPP_STATES, STATUS_CLASS } from "@/utils/consts";
import { api, getStatusText } from "@/utils/functions";
import './page.css';

const headers = {
  "ngrok-skip-browser-warning": "true"
}

export default function Home() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'waiting' | 'disconnected' | 'reconnecting' | 'uninitialized' | 'loading'>('loading');
  const [message, setMessage] = useState({ number: "55", message: "" });
  const [isUserDisconnection, setIsUserDisconnection] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      extraHeaders: headers,
      transports: ['websocket']
    });

    socketRef.current = socket;

    fetch(api('/api/session-status'), { headers })
      .then(res => res.json())
      .then(data => {
        const state = data.state;
        console.log("Estado da sessão:", state);

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

  async function tryReconnect(attempt = 1) {
    const MAX_ATTEMPTS = 7;
    if (attempt > MAX_ATTEMPTS) {
      return console.error("🛑 Não foi possível reconectar após várias tentativas.");
    }

    console.log(`🔄 Tentativa de reconexão ${attempt}/${MAX_ATTEMPTS}...`);
    try {
      const res = await fetch(api('/api/generate-qr'), { method: 'POST', headers });
      if (res.ok) {
        console.log("✅ Reconectado!");
        setStatus('reconnecting');
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => tryReconnect(attempt + 1), 10000);
    }
  }

  const handleSendTest = async () => {
    alert(`Enviando mensagem: \n${message.message}`);
    const body = JSON.stringify({ to: message.number, message: message.message })
    const res = await fetch(api("/api/send-message"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
    alert(`Resposta do Servidor: \n${res.ok ? "Sucesso" : "Falhou"}`);
  };

  const handleDisconnect = async () => {
    const res = await fetch(api('/api/disconnect'), { method: 'POST', headers });
    alert(`Resposta do Servidor: \n${res.ok ? "Sucesso" : "Falhou"}`);
    if (res.ok) {
      setIsUserDisconnection(true);
      setStatus('disconnected');
    }
  };

  const handleGenerateQR = async () => {
    setLoadingQR(true);
    setQrCode(null);
    try {
      const res = await fetch(api('/api/generate-qr'), { method: 'POST', headers });
      if (!res.ok) throw new Error('Falha ao gerar QR Code.');
      setStatus('uninitialized');
    } catch (error) {
      alert('Erro ao gerar QR Code.');
    } finally {
      setLoadingQR(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">GeoView Conexão com WhatsApp</h1>

      <div className={`status ${STATUS_CLASS[status]}`}>
        {getStatusText(status)}
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
          <div>
            <p>Demorando muito ou não conseguindo conectar?</p>
            <button
              onClick={handleGenerateQR}
              className={loadingQR ? "button gray" : "button blue"}
              disabled={loadingQR}
            >
              {loadingQR ? 'Carregando QR Code...' : 'Gerar Novo QR Code'}
            </button>
          </div>
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
