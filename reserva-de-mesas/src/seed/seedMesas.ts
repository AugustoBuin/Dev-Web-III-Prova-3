import "dotenv/config";
import mongoose from "mongoose";
import { Mesa } from "../models/Mesa.model";

const MESAS = [
    { numero: 1, capacidade: 2, localizacao: "Salão" },
    { numero: 2, capacidade: 2, localizacao: "Salão" },
    { numero: 3, capacidade: 4, localizacao: "Varanda" },
    { numero: 4, capacidade: 4, localizacao: "Varanda" },
    { numero: 5, capacidade: 6, localizacao: "Área Interna" },
    { numero: 6, capacidade: 8, localizacao: "Área Interna" }
];

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ Erro: faltou MONGODB_URI no .env");
        return;
    }

    // log sanitizado (sem credenciais)
    console.log("Conectando em:", uri.replace(/\/\/.*@/, "//***:***@"));

    // conecta no Atlas
    await mongoose.connect(uri, {
        dbName: "dweb3",
        serverSelectionTimeoutMS: 15000,
    });

    console.log("🍃 MongoDB Atlas conectado com sucesso.");

    // popular mesas
    for (const m of MESAS) {
        const exists = await Mesa.findOne({ numero: m.numero });
        if (!exists) {
            await new Mesa(m).save();
            console.log("Mesa criada:", m.numero);
        } else {
            console.log("Mesa já existe:", m.numero);
        }
    }
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
