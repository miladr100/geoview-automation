import { NextRequest, NextResponse } from 'next/server';
import { getClient } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
    try {
        const { to, message } = await req.json();

        if (!to || !message) {
            return NextResponse.json({ error: 'Número e mensagem obrigatórios' }, { status: 400 });
        }

        const client = getClient();

        if (!client.info) {
            return NextResponse.json({ message: 'Cliente não está conectado...' });
        }

        await client.sendMessage(`${to}@c.us`, message);

        return NextResponse.json({ message: 'Mensagem enviada com sucesso' });
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
    }
}
