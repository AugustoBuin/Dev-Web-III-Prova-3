import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

// rotas unificadas (reservas + mesas)
import { reservaRoutes } from "./routes/reserva.routes";
import { mesaRoutes } from "./routes/mesa.routes";

const app = express();

// middlewares padrão
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// servir front-end estático 
app.use(express.static(path.join(__dirname, "views")));
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// rota de saúde 
app.get("/health", (_req, res) => {
    const state = mongoose.connection.readyState;
    res.json({ ok: true, mongoState: state }); // 1 conectado, 2 conectando
});

// função bootstrap 
async function bootstrap() {
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

    // rotas baseadas no padrão do exercício 7
    app.use("/reservas", reservaRoutes);
    app.use("/mesas", mesaRoutes);

    const port = process.env.PORT || 3000;
    app.listen(port, () =>
        console.log(`🚀 Servidor rodando em http://localhost:${port}`)
    );
}

bootstrap();
