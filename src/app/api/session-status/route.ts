import { NextResponse } from 'next/server';
import { getClient } from '@/lib/whatsapp';

//all status "CONNECTED", "OPENING", "PAIRING", "UNPAIRED", "UNPAIRED_IDLE", "CONFLICT", "TIMEOUT", "DEPRECATED_VERSION"

export async function GET() {
  try {
    const client = getClient();
    const state = await client.getState();

    const isConnected = state === 'CONNECTED';

    return NextResponse.json({
      connected: isConnected,
      state, // ex: 'CONNECTED', 'PAIRING', etc.
    });
  } catch (err) {
    console.error('Erro ao obter status da sessão:', err);
    return NextResponse.json({
      connected: false,
      state: 'DISCONNECTED',
    });
  }
}
