// lib/socket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import next from 'next';
import { initWhatsApp } from './whatsapp';

declare global {
    var _socketIO: Server | undefined;
}
global._socketIO = global._socketIO || undefined;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => handler(req, res));
    const io = new Server(server, {
        cors: { origin: '*' },
    });

    global._socketIO = io;

    io.on('connection', socket => {
        console.log('Cliente WebSocket conectado');
    });

    initWhatsApp(io);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
});