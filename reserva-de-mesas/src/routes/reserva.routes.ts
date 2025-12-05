import { Router } from "express";
import { criarReserva, listarReservas, atualizarReserva, cancelarReserva } from "../controllers/reserva.controller";
export const reservaRoutes = Router();

reservaRoutes.post("/", criarReserva);
reservaRoutes.get("/", listarReservas);
reservaRoutes.put("/:id", atualizarReserva);
reservaRoutes.delete("/:id", cancelarReserva);
