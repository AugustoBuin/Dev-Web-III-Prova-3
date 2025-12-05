import { Request, Response } from "express";
import { Reserva } from "../models/Reserva.model";
import { Mesa } from "../models/Mesa.model";
import { addMinutes, overlaps } from "../utils/timeUtils";
import { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_DURATION = Number(process.env.DEFAULT_DURATION_MINUTES || 90);

function sanitizeDate(d: any) {
    const date = new Date(d);
    if (isNaN(date.getTime())) throw new Error("Data inválida");
    return date;
}

export const criarReserva = async (req: Request, res: Response) => {
    try {
        const { cliente, contato, mesa, pessoas, dataHora, observacoes } = req.body;

        if (!cliente || !contato || !mesa || !pessoas || !dataHora) {
            return res.status(400).json({ error: "Campos obrigatórios ausentes" });
        }

        const mesaDoc = await Mesa.findOne({ numero: mesa });
        if (!mesaDoc) return res.status(400).json({ error: "Mesa inexistente" });

        if (pessoas > mesaDoc.capacidade) {
            return res.status(400).json({ error: "Mesa não comporta o número de pessoas" });
        }

        const inicio = sanitizeDate(dataHora);
        const agora = new Date();
        const minAntecedencia = new Date(agora.getTime() + 60 * 60000); // +1h
        if (inicio < minAntecedencia) {
            return res.status(400).json({ error: "Reservas devem ser feitas com antecedência mínima de 1 hora" });
        }

        const fim = addMinutes(inicio, DEFAULT_DURATION);

        // checar conflitos: mesmas mesa, status != cancelado, overlap time
        const conflitantes = await Reserva.find({
            mesa: mesa,
            status: { $ne: "cancelado" }
        });

        for (const r of conflitantes) {
            const rInicio = new Date(r.dataHora);
            const rFim = addMinutes(rInicio, DEFAULT_DURATION);
            if (overlaps(inicio, fim, rInicio, rFim)) {
                return res.status(409).json({ error: "Conflito de horário com outra reserva nesta mesa", reserva: r });
            }
        }

        const reserva = new Reserva({
            cliente, contato, mesa, pessoas, dataHora: inicio, observacoes, status: "reservado"
        });
        await reserva.save();

        res.status(201).json({ message: "Reserva criada", reserva });
    } catch (err: any) {
        res.status(500).json({ error: "Erro ao criar reserva", details: err.message });
    }
};

export const listarReservas = async (req: Request, res: Response) => {
    try {
        // filtros opcionais: cliente, mesa, status, data (YYYY-MM-DD)
        const { cliente, mesa, status, data } = req.query;
        const query: any = {};
        if (cliente) query.cliente = { $regex: String(cliente), $options: "i" };
        if (mesa) query.mesa = Number(mesa);
        if (status) query.status = String(status);

        if (data) {
            const day = new Date(String(data));
            if (isNaN(day.getTime())) return res.status(400).json({ error: "data inválida" });
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            query.dataHora = { $gte: day, $lt: next };
        }

        let reservas = await Reserva.find(query).sort({ dataHora: 1 });

        // atualizar status dinamicamente conforme o tempo (sem persistir)
        const agora = new Date();
        reservas = reservas.map(r => {
            if (r.status === "cancelado") return r;
            const inicio = new Date(r.dataHora);
            const fim = addMinutes(inicio, DEFAULT_DURATION);

            if (agora < inicio) r.status = "reservado";
            else if (agora >= inicio && agora <= fim) r.status = "ocupado";
            else if (agora > fim) r.status = "finalizado";

            return r;
        });

        res.json(reservas);
    } catch (err: any) {
        res.status(500).json({ error: "Erro ao listar reservas", details: err.message });
    }
};

export const atualizarReserva = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "ID inválido" });

        const update = req.body;
        // Se alterar mesa/pessoas/dataHora devemos revalidar
        const reservaExist = await Reserva.findById(id);
        if (!reservaExist) return res.status(404).json({ error: "Reserva não encontrada" });

        // se trocar para cancelado -> apenas atualiza
        if (update.status && update.status === "cancelado") {
            reservaExist.status = "cancelado";
            await reservaExist.save();
            return res.json({ message: "Reserva cancelada", reserva: reservaExist });
        }

        // combine dados novos com existentes para validação
        const novoMesa = update.mesa ?? reservaExist.mesa;
        const novoPessoas = update.pessoas ?? reservaExist.pessoas;
        const novoDataHora = update.dataHora ? sanitizeDate(update.dataHora) : new Date(reservaExist.dataHora);

        const mesaDoc = await Mesa.findOne({ numero: novoMesa });
        if (!mesaDoc) return res.status(400).json({ error: "Mesa inexistente" });

        if (novoPessoas > mesaDoc.capacidade) {
            return res.status(400).json({ error: "Mesa não comporta o número de pessoas" });
        }

        const agora = new Date();
        const minAntecedencia = new Date(agora.getTime() + 60 * 60000); // +1h
        if (novoDataHora < minAntecedencia) {
            return res.status(400).json({ error: "Reservas devem ser feitas com antecedência mínima de 1 hora" });
        }

        const novoFim = addMinutes(novoDataHora, DEFAULT_DURATION);

        // checar conflitos com outras reservas (exceto a própria), status != cancelado
        const conflitantes = await Reserva.find({
            mesa: novoMesa,
            _id: { $ne: reservaExist._id },
            status: { $ne: "cancelado" }
        });

        for (const r of conflitantes) {
            const rInicio = new Date(r.dataHora);
            const rFim = addMinutes(rInicio, DEFAULT_DURATION);
            if (overlaps(novoDataHora, novoFim, rInicio, rFim)) {
                return res.status(409).json({ error: "Conflito de horário com outra reserva nesta mesa", reserva: r });
            }
        }

        // aplicar atualização
        reservaExist.cliente = update.cliente ?? reservaExist.cliente;
        reservaExist.contato = update.contato ?? reservaExist.contato;
        reservaExist.mesa = novoMesa;
        reservaExist.pessoas = novoPessoas;
        reservaExist.dataHora = novoDataHora;
        if (update.observacoes !== undefined) reservaExist.observacoes = update.observacoes;
        if (update.status) reservaExist.status = update.status;

        await reservaExist.save();
        res.json({ message: "Reserva atualizada", reserva: reservaExist });
    } catch (err: any) {
        res.status(500).json({ error: "Erro ao atualizar reserva", details: err.message });
    }
};

export const cancelarReserva = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findById(id);
        if (!reserva) return res.status(404).json({ error: "Reserva não encontrada" });

        reserva.status = "cancelado";
        await reserva.save();
        res.json({ message: "Reserva cancelada", reserva });
    } catch (err: any) {
        res.status(500).json({ error: "Erro ao cancelar reserva", details: err.message });
    }
};
