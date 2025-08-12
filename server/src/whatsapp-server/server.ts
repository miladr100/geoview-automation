import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { Server } from "socket.io";
import { initWhatsApp } from "./whatsapp";
import { connectMongo } from './mongo';
import { WHATSAPP_PORT, FRONT_URL } from '../../env';

import disconnectRoutes from './routes/disconnect';
import generateQrRoutes from './routes/generate-qr';
import sessionStatusRoutes from './routes/session-status';
import sendResponseRoutes from './routes/send-response';
import checkNumberRoutes from './routes/check-number';
import sendMessageRoutes from './routes/send-message';
import ping from './routes/ping';

async function start() {
    await connectMongo();

    const app = express();
    app.use(cors({ origin: FRONT_URL }));
    app.use(bodyParser.json());

    app.use('/api/disconnect', disconnectRoutes);
    app.use('/api/generate-qr', generateQrRoutes);
    app.use('/api/session-status', sessionStatusRoutes);
    app.use('/api/send-response', sendResponseRoutes);
    app.use('/api/send-message', sendMessageRoutes);
    app.use('/api/check-number', checkNumberRoutes);
    app.use('/api/ping', ping);

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: FRONT_URL,
            methods: ["GET", "POST", "PATCH"]
        }
    });

    io.on("connection", (_) => {
        console.log("🟢 Cliente WebSocket conectado");
    });

    initWhatsApp(io);

    httpServer.listen(WHATSAPP_PORT, () => {
        console.log(`🚀 Servidor Socket + WhatsApp rodando na porta ${WHATSAPP_PORT}`);
    });
}

start();
