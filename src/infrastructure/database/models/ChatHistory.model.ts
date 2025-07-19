import mongoose, { Schema, Document } from 'mongoose';
import { EstadoMensaje } from '@shared/types/response.types';

export interface IChatHistoryDocument extends Document {
  _id: string;
  mensaje: string;
  estado: EstadoMensaje;
  fecha: Date;
  usuario_id: string;
  created_at: Date;
  updated_at: Date;
  is_ai_response: boolean;
  response_to_message_id?: string;
  conversation_id?: string;
  recipient_id?: string;
}

const ChatHistorySchema = new Schema<IChatHistoryDocument>({
  _id: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000 // Límite de caracteres para mensajes
  },
  estado: {
    type: String,
    enum: ['enviado', 'entregado', 'leido', 'fallido'],
    default: 'enviado',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  usuario_id: {
    type: String,
    required: true,
    index: true // Índice para búsquedas por usuario
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_ai_response: {
    type: Boolean,
    default: false,
    index: true // Índice para filtrar entre mensajes de usuario e IA
  },
  response_to_message_id: {
    type: String,
    default: undefined,
    index: true // Índice para encontrar respuestas relacionadas
  },
  conversation_id: {
    type: String,
    default: undefined,
    index: true // Índice para buscar mensajes por conversación
  },
  recipient_id: {
    type: String,
    default: undefined,
    index: true // Índice para buscar mensajes por destinatario
  }
}, {
  _id: false, // Desactivar auto-generación de _id
  timestamps: false // Usar nuestros propios campos de tiempo
});

// Índices compuestos para optimizar consultas
ChatHistorySchema.index({ usuario_id: 1, fecha: -1 }); // Buscar por usuario ordenado por fecha
ChatHistorySchema.index({ usuario_id: 1, is_ai_response: 1, fecha: -1 }); // Filtrar por tipo de mensaje
ChatHistorySchema.index({ response_to_message_id: 1 }); // Buscar respuestas relacionadas
ChatHistorySchema.index({ conversation_id: 1, fecha: -1 }); // Buscar mensajes por conversación
ChatHistorySchema.index({ usuario_id: 1, conversation_id: 1, fecha: -1 }); // Buscar mensajes de usuario en conversación
ChatHistorySchema.index({ recipient_id: 1, fecha: -1 }); // Buscar mensajes por destinatario

// Middleware para actualizar updated_at automáticamente
ChatHistorySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

// Método para marcar como leído
ChatHistorySchema.methods.markAsRead = function() {
  this.estado = 'leido';
  this.updated_at = new Date();
  return this.save();
};

// Método estático para buscar conversación entre usuarios
ChatHistorySchema.statics.findConversation = function(usuario1: string, usuario2?: string, limit = 50) {
  const query: any = { usuario_id: usuario1 };
  
  return this.find(query)
    .sort({ fecha: -1 })
    .limit(limit)
    .lean()
    .exec();
};

// Método estático para buscar mensajes de una conversación 1 a 1
ChatHistorySchema.statics.findByConversation = function(conversationId: string, limit = 50) {
  return this.find({ conversation_id: conversationId })
    .sort({ fecha: -1 })
    .limit(limit)
    .lean()
    .exec();
};

// Método estático para buscar conversaciones de un usuario
ChatHistorySchema.statics.findUserConversations = function(userId: string, limit = 20) {
  return this.find({
    $or: [
      { usuario_id: userId },
      { recipient_id: userId }
    ]
  })
  .sort({ fecha: -1 })
  .limit(limit)
  .lean()
  .exec();
};

export const ChatHistoryModel = mongoose.model<IChatHistoryDocument>('ChatHistory', ChatHistorySchema); 