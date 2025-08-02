// src/pages/api/generate-qr.ts
import { NextRequest, NextResponse } from 'next/server';
import { initWhatsApp } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    await initWhatsApp(); // sem precisar de socketServer
    return NextResponse.json({ message: 'Gerando novo QR Code...' });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return NextResponse.json({ message: 'Erro ao gerar QR Code.' }, { status: 500 });
  }
}
