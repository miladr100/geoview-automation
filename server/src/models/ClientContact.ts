import mongoose, { Schema, Document } from 'mongoose';

export interface IClientContact extends Document {
  whatsappName: string;
  phone: string;
  status: string;
  service?: string | null;
  form?: string | null;
  boardId?: string | null;
  groupId?: string | null;
  block?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientContactSchema = new Schema<IClientContact>(
  {
    whatsappName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    service: { type: String, default: null },
    boardId: { type: String, default: null },
    groupId: { type: String, default: null },
    block: { type: Boolean, default: false },
    form: { type: String, default: null },
  },
  { timestamps: true }
);

export const ClientContactModel =
  mongoose.models.ClientContact ||
  mongoose.model<IClientContact>('ClientContact', ClientContactSchema);
