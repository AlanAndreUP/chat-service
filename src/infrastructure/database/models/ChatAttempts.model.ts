import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatAttemptCounterDocument extends Document {
  _id: string;
  usuario_id: string;
  fecha: Date;
  conversation_id?: string;
  cantidad: number;
}

export interface IChatAttemptCounterModel extends Model<IChatAttemptCounterDocument> {}

const ChatAttemptCounterSchema = new Schema<IChatAttemptCounterDocument>({
  _id: {
    type: String,
    required: true
  },
  usuario_id: {
    type: String,
    required: true,
    index: true
  },
  fecha: {
    type: Date,
    required: true,
    index: true
  },
  conversation_id: {
    type: String,
    default: null,
    index: true
  },
  cantidad: {
    type: Number,
    default: 1
  }
}, {
  _id: false,
  timestamps: false
});

ChatAttemptCounterSchema.index({ usuario_id: 1, fecha: 1 });
ChatAttemptCounterSchema.index({ conversation_id: 1, fecha: 1 });

export const ChatAttemptsModel = mongoose.model<IChatAttemptCounterDocument, IChatAttemptCounterModel>('ChatAttemptCounter', ChatAttemptCounterSchema); 