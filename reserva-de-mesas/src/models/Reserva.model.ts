import mongoose, { Document } from "mongoose";

export type ReservaStatus = "reservado" | "ocupado" | "finalizado" | "cancelado";

export interface IReserva extends Document {
    cliente: string;
    contato: string;
    mesa: number;
    pessoas: number;
    dataHora: Date;
    observacoes?: string;
    status: ReservaStatus;
    createdAt: Date;
    updatedAt: Date;
}

const reservaSchema = new mongoose.Schema<IReserva>({
    cliente: { type: String, required: true },
    contato: { type: String, required: true },
    mesa: { type: Number, required: true },
    pessoas: { type: Number, required: true },
    dataHora: { type: Date, required: true },
    observacoes: { type: String },
    status: {
        type: String,
        enum: ["reservado", "ocupado", "finalizado", "cancelado"],
        default: "reservado"
    }
}, { timestamps: true });

export const Reserva = mongoose.model<IReserva>("Reserva", reservaSchema);
