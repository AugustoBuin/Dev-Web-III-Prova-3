import { Request, Response } from "express";
import { Mesa } from "../models/Mesa.model";

export const criarMesa = async (req: Request, res: Response) => {
    try {
        const { numero, capacidade, localizacao } = req.body;
        const mesa = new Mesa({ numero, capacidade, localizacao });
        await mesa.save();
        res.status(201).json({ message: "Mesa criada", mesa });
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Número da mesa já existe" });
        }
        res.status(500).json({ error: "Erro ao criar mesa", details: err.message });
    }
};

export const listarMesas = async (_req: Request, res: Response) => {
    try {
        const mesas = await Mesa.find().sort({ numero: 1 });
        res.json(mesas);
    } catch (err) {
        res.status(500).json({ error: "Erro ao listar mesas" });
    }
};
