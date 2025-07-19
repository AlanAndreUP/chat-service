import mongoose, { Schema, Document } from 'mongoose';

export interface IChatPorEstudianteDocument extends Document {
  _id: string;
  chat_id: string;
  estudiante_id: string;
  created_at: Date;
}

const ChatPorEstudianteSchema = new Schema<IChatPorEstudianteDocument>({
  _id: {
    type: String,
    required: true
  },
  chat_id: {
    type: String,
    required: true,
    ref: 'ChatHistory',
    index: true
  },
  estudiante_id: {
    type: String,
    required: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false,
  timestamps: false
});

// Índice único compuesto para evitar duplicados
ChatPorEstudianteSchema.index({ chat_id: 1, estudiante_id: 1 }, { unique: true });

// Índices para optimizar consultas
ChatPorEstudianteSchema.index({ estudiante_id: 1, created_at: -1 });
ChatPorEstudianteSchema.index({ chat_id: 1 });

// Método estático para crear o encontrar relación
ChatPorEstudianteSchema.statics.findOrCreate = async function(chatId: string, estudianteId: string) {
  try {
    // Intentar encontrar la relación existente
    const existing = await this.findOne({
      chat_id: chatId,
      estudiante_id: estudianteId
    });

    if (existing) {
      return existing;
    }

    // Crear nueva relación si no existe
    const newRelation = new this({
      _id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      chat_id: chatId,
      estudiante_id: estudianteId,
      created_at: new Date()
    });

    return await newRelation.save();
  } catch (error: any) {
    // Si el error es por duplicado, intentar encontrar el existente
    if (error.code === 11000) {
      return await this.findOne({
        chat_id: chatId,
        estudiante_id: estudianteId
      });
    }
    throw error;
  }
};

// Método estático para obtener todos los chats de un estudiante
ChatPorEstudianteSchema.statics.findChatsByStudent = function(estudianteId: string) {
  return this.find({ estudiante_id: estudianteId })
    .populate('chat_id')
    .sort({ created_at: -1 })
    .lean()
    .exec();
};

// Método estático para obtener estudiantes en un chat
ChatPorEstudianteSchema.statics.findStudentsInChat = function(chatId: string) {
  return this.find({ chat_id: chatId })
    .sort({ created_at: 1 })
    .lean()
    .exec();
};

// Método estático para eliminar relación
ChatPorEstudianteSchema.statics.removeRelation = function(chatId: string, estudianteId: string) {
  return this.deleteOne({
    chat_id: chatId,
    estudiante_id: estudianteId
  });
};

// Método estático para contar chats activos por estudiante
ChatPorEstudianteSchema.statics.countActiveChats = function(estudianteId: string) {
  return this.countDocuments({ estudiante_id: estudianteId });
};

export const ChatPorEstudianteModel = mongoose.model<IChatPorEstudianteDocument>('ChatPorEstudiante', ChatPorEstudianteSchema); 