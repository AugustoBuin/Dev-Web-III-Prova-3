import { Router } from "express";
import { criarMesa, listarMesas } from "../controllers/mesa.controller";
export const mesaRoutes = Router();

mesaRoutes.post("/", criarMesa);
mesaRoutes.get("/", listarMesas);
