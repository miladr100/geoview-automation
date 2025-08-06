// cron-cleaner.ts
import mongoose from "mongoose";
import cron from "node-cron";
import { ClientContactModel } from "./models/ClientContact";
import { MONGO_URL } from '../env';

if (!MONGO_URL) {
  console.error("❌ MONGO_URI não definido no env");
  process.exit(1);
}

async function connectIfNotConnected() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URL);
  }
}

const ClientContact = mongoose.model("ClientContact", ClientContactModel.schema);

// 🔁 Executa 1 vez por dia às 02:00 da manhã
cron.schedule("0 2 * * *", async () => {
  console.log("🧹 Limpando dados antigos...");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 15);

  try {
    const result = await ClientContact.deleteMany({
      block: { $ne: true }, // não remove se block === true
      $or: [
        { createdAt: { $lt: cutoff } },
        { form: { $in: [null, undefined] } }
      ]
    });
    console.log(`✅ ${result.deletedCount} documentos apagados.`);
  } catch (err) {
    console.error("❌ Erro ao apagar documentos:", err);
  }
});

// 🔌 Inicia a conexão e mantém o processo rodando
async function start() {
  try {
    await connectIfNotConnected();
    console.log("✅ Conectado ao MongoDB. Aguardando agendador...");
  } catch (err) {
    console.error("❌ Erro ao conectar no MongoDB:", err);
    process.exit(1);
  }
}

start();
