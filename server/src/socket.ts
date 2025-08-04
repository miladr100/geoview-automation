import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { Server } from "socket.io";
import { initWhatsApp } from "./whatsapp";
import { connectMongo } from "./mongo";
import { PORT } from '../env';

import checkSession from './routes/check-session';
import contactsRoutes from './routes/contacts';
import disconnectRoutes from './routes/disconnect';
import generateQrRoutes from './routes/generate-qr';
import sendMessageRoutes from './routes/send-message';
import sessionStatusRoutes from './routes/session-status';
import createMondayTaskRoutes from './routes/create-monday-task';
import addMondayCommentRoutes from './routes/add-monday-comment';
import { FRONT_URL } from '../env';
import ping from './routes/ping';

async function start() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: FRONT_URL }));
  app.use(bodyParser.json());

  app.use('/api/ping', ping);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/disconnect', disconnectRoutes);
  app.use('/api/check-session', checkSession);
  app.use('/api/generate-qr', generateQrRoutes);
  app.use('/api/send-message', sendMessageRoutes);
  app.use('/api/session-status', sessionStatusRoutes);
  app.use('/api/create-monday-task', createMondayTaskRoutes);
  app.use('/api/add-monday-comment', addMondayCommentRoutes);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Cliente WebSocket conectado");
  });

  initWhatsApp(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor Socket + WhatsApp rodando na porta ${PORT}`);
  });
}

start();
