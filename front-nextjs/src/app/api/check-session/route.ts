import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { SESSION_ID, MONGO_URL } from '@/utils/consts';

export async function POST(req: NextRequest) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URL);
    }

    const db = mongoose.connection.db;
    const filesCollection = db?.collection(`whatsapp-RemoteAuth-${SESSION_ID}.files`);
    const fileCount = await filesCollection?.countDocuments();

    if (fileCount === 0) {
      return NextResponse.json({
        session: false,
        message: 'Nenhuma sessão encontrada.',
      });
    }

    return NextResponse.json({
      session: true,
      message: 'Sessão encontrada.',
    });
  } catch (error) {
    console.error('Erro ao tentar reconectar:', error);
    return NextResponse.json(
      { reconnected: false, message: 'Erro ao tentar reconectar.' },
      { status: 500 }
    );
  }
}
