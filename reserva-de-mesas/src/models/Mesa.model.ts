import mongoose, { Document } from "mongoose";

export interface IMesa extends Document {
    numero: number;
    capacidade: number;
    localizacao: string;
}

const mesaSchema = new mongoose.Schema<IMesa>({
    numero: { type: Number, required: true, unique: true },
    capacidade: { type: Number, required: true },
    localizacao: { type: String, required: true }
});

export const Mesa = mongoose.model<IMesa>("Mesa", mesaSchema);
