import { ChatAttemptsRepository } from '@domain/repositories/ChatAttemptsRepository.interface';
import { ChatAttemptsModel } from '@infrastructure/database/models/ChatAttempts.model';
import { ChatAttemptCounter } from '@domain/entities/ChatAttempts.entity';

export class MongoChatAttemptsRepository implements ChatAttemptsRepository {
  async increment(usuario_id: string, conversation_id: string | undefined, fecha: Date): Promise<ChatAttemptCounter> {
    const id = `${usuario_id}_${conversation_id || 'none'}_${fecha.toISOString().split('T')[0]}`;
    const update = {
      $inc: { cantidad: 1 },
      $setOnInsert: {
        usuario_id,
        conversation_id,
        fecha
      }
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await ChatAttemptsModel.findOneAndUpdate(
      { _id: id },
      update,
      opts
    ).lean();
    if (!doc) throw new Error('No se pudo incrementar el contador de intentos');
    return new ChatAttemptCounter(
      doc._id,
      doc.usuario_id,
      doc.fecha,
      doc.conversation_id,
      doc.cantidad
    );
  }

  async getByUserAndDate(usuario_id: string, fecha: Date): Promise<ChatAttemptCounter | null> {
    const doc = await ChatAttemptsModel.findOne({ usuario_id, fecha }).lean();
    if (!doc) return null;
    return new ChatAttemptCounter(
      doc._id,
      doc.usuario_id,
      doc.fecha,
      doc.conversation_id,
      doc.cantidad
    );
  }

  async getByConversationAndDate(conversation_id: string, fecha: Date): Promise<ChatAttemptCounter | null> {
    const doc = await ChatAttemptsModel.findOne({ conversation_id, fecha }).lean();
    if (!doc) return null;
    return new ChatAttemptCounter(
      doc._id,
      doc.usuario_id,
      doc.fecha,
      doc.conversation_id,
      doc.cantidad
    );
  }

  async getAllByUser(usuario_id: string): Promise<ChatAttemptCounter[]> {
    const docs = await ChatAttemptsModel.find({ usuario_id }).sort({ fecha: -1 }).lean();
    return docs.map((doc: any) => new ChatAttemptCounter(
      doc._id,
      doc.usuario_id,
      doc.fecha,
      doc.conversation_id,
      doc.cantidad
    ));
  }
} 