import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { FRONT_URL, MESSAGE_PORT } from '../../env';
import { connectMongo } from './utils/mongo';

import contactsRoutes from './routes/contacts';
import processMessageRoutes from './routes/process-message';
import createMondayTaskRoutes from './routes/create-monday-task';
import addMondayCommentRoutes from './routes/add-monday-comment';
import blockContactRoutes from './routes/block-contact';
import ping from './routes/ping';

async function start() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: FRONT_URL }));
  app.use(bodyParser.json());

  app.use('/api/contacts', contactsRoutes);
  app.use('/api/process-message', processMessageRoutes);
  app.use('/api/create-monday-task', createMondayTaskRoutes);
  app.use('/api/add-monday-comment', addMondayCommentRoutes);
  app.use('/api/block-contact', blockContactRoutes);
  app.use('/api/ping', ping);

  const httpServer = createServer(app);

  httpServer.listen(MESSAGE_PORT, () => {
    console.log(`🚀 Servidor de mensagens rodando na porta ${MESSAGE_PORT}`);
  });
}

start();
