// src/app/api/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClient, deleteClient } from "@/lib/whatsapp";
import { deleteRemoteAuthSession } from "@/utils/functions";

export async function POST(req: NextRequest) {
  try {
    const client = getClient();

    if (!client.info) {
      return NextResponse.json({ message: 'Cliente já está desconectado.' });
    }
    await client.destroy();

    const store = (client as any).authStrategy?.store;
    if (store && typeof store.delete === 'function') {
      await deleteRemoteAuthSession('geoview');
      deleteClient();
    }

    return NextResponse.json({ message: 'Cliente desconectado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    return NextResponse.json({ message: 'Erro ao desconectar.' }, { status: 500 });
  }
}
