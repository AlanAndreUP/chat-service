import { ChatAttemptsRepository, ChatAttemptFilters } from '@domain/repositories/ChatAttemptsRepository.interface';
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

  async getAllByUser(filters: ChatAttemptFilters): Promise<{ attempts: ChatAttemptCounter[]; total: number; }> {
    const query: any = { usuario_id: filters.usuario_id };
    if (filters.conversation_id) {
      query.conversation_id = filters.conversation_id;
    }
    if (filters.fecha_desde) {
      query.fecha = { ...query.fecha, $gte: filters.fecha_desde };
    }
    if (filters.fecha_hasta) {
      query.fecha = { ...query.fecha, $lte: filters.fecha_hasta };
    }
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ChatAttemptsModel.find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatAttemptsModel.countDocuments(query)
    ]);
    return {
      attempts: docs.map((doc: any) => new ChatAttemptCounter(
        doc._id,
        doc.usuario_id,
        doc.fecha,
        doc.conversation_id,
        doc.cantidad
      )),
      total
    };
  }

  async getAllByUserPaginated(usuario_id: string, skip: number, limit: number): Promise<ChatAttemptCounter[]> {
    const docs = await ChatAttemptsModel.find({ usuario_id })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return docs.map((doc: any) => new ChatAttemptCounter(
      doc._id,
      doc.usuario_id,
      doc.fecha,
      doc.conversation_id,
      doc.cantidad
    ));
  }

  async countByUser(usuario_id: string): Promise<number> {
    return ChatAttemptsModel.countDocuments({ usuario_id });
  }
} 