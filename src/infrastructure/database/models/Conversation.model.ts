import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationDocument extends Document {
  _id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_message_at?: Date;
}

const ConversationSchema = new Schema<IConversationDocument>({
  _id: {
    type: String,
    required: true
  },
  participant1_id: {
    type: String,
    required: true,
    index: true
  },
  participant2_id: {
    type: String,
    required: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  last_message_at: {
    type: Date,
    default: undefined
  }
}, {
  _id: false,
  timestamps: false
});

// Índices compuestos para optimizar consultas
ConversationSchema.index({ participant1_id: 1, participant2_id: 1 }, { unique: true });
ConversationSchema.index({ participant1_id: 1, is_active: 1, last_message_at: -1 });
ConversationSchema.index({ participant2_id: 1, is_active: 1, last_message_at: -1 });

// Middleware para actualizar updated_at automáticamente
ConversationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

// Método estático para encontrar o crear conversación entre dos usuarios
ConversationSchema.statics.findOrCreateConversation = async function(participant1: string, participant2: string) {
  const [p1, p2] = [participant1, participant2].sort();
  
  let conversation = await this.findOne({
    participant1_id: p1,
    participant2_id: p2,
    is_active: true
  });

  if (!conversation) {
    conversation = new this({
      _id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      participant1_id: p1,
      participant2_id: p2,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    });
    await conversation.save();
  }

  return conversation;
};

// Método estático para obtener conversaciones de un usuario
ConversationSchema.statics.findByParticipant = function(userId: string, limit = 20) {
  return this.find({
    $or: [
      { participant1_id: userId },
      { participant2_id: userId }
    ],
    is_active: true
  })
  .sort({ last_message_at: -1, updated_at: -1 })
  .limit(limit)
  .lean()
  .exec();
};

export const ConversationModel = mongoose.model<IConversationDocument>('Conversation', ConversationSchema); 