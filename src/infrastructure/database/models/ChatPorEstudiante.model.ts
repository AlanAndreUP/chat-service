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

ChatPorEstudianteSchema.index({ chat_id: 1, estudiante_id: 1 }, { unique: true });

ChatPorEstudianteSchema.index({ estudiante_id: 1, created_at: -1 });
ChatPorEstudianteSchema.index({ chat_id: 1 });

ChatPorEstudianteSchema.statics.findOrCreate = async function(chatId: string, estudianteId: string) {
  try {
    const existing = await this.findOne({
      chat_id: chatId,
      estudiante_id: estudianteId
    });

    if (existing) {
      return existing;
    }

    const newRelation = new this({
      _id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      chat_id: chatId,
      estudiante_id: estudianteId,
      created_at: new Date()
    });

    return await newRelation.save();
  } catch (error: any) {
    if (error.code === 11000) {
      return await this.findOne({
        chat_id: chatId,
        estudiante_id: estudianteId
      });
    }
    throw error;
  }
};

ChatPorEstudianteSchema.statics.findChatsByStudent = function(estudianteId: string) {
  return this.find({ estudiante_id: estudianteId })
    .populate('chat_id')
    .sort({ created_at: -1 })
    .lean()
    .exec();
};

ChatPorEstudianteSchema.statics.findStudentsInChat = function(chatId: string) {
  return this.find({ chat_id: chatId })
    .sort({ created_at: 1 })
    .lean()
    .exec();
};

ChatPorEstudianteSchema.statics.removeRelation = function(chatId: string, estudianteId: string) {
  return this.deleteOne({
    chat_id: chatId,
    estudiante_id: estudianteId
  });
};

ChatPorEstudianteSchema.statics.countActiveChats = function(estudianteId: string) {
  return this.countDocuments({ estudiante_id: estudianteId });
};

export const ChatPorEstudianteModel = mongoose.model<IChatPorEstudianteDocument>('ChatPorEstudiante', ChatPorEstudianteSchema); 