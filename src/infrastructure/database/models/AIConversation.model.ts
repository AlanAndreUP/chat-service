import mongoose, { Document, Schema } from 'mongoose';

export interface IAIConversationDocument extends Document {
  user_id: string;
  conversation_id: string;
  messages: Array<{
    id: string;
    content: string;
    is_ai_response: boolean;
    timestamp: Date;
    analysis_id?: string; // Referencia al análisis de IA si aplica
  }>;
  total_messages: number;
  ai_responses_count: number;
  user_messages_count: number;
  first_message_at: Date;
  last_message_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  addMessage(messageId: string, content: string, isAIResponse: boolean, analysisId?: string): Promise<IAIConversationDocument>;
  getMessages(limit?: number): Array<{
    id: string;
    content: string;
    is_ai_response: boolean;
    timestamp: Date;
    analysis_id?: string;
  }>;
}

const AIConversationSchema = new Schema<IAIConversationDocument>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  conversation_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  messages: [{
    id: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    is_ai_response: {
      type: Boolean,
      required: true,
      default: false
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    analysis_id: {
      type: String,
      index: true
    }
  }],
  total_messages: {
    type: Number,
    required: true,
    default: 0
  },
  ai_responses_count: {
    type: Number,
    required: true,
    default: 0
  },
  user_messages_count: {
    type: Number,
    required: true,
    default: 0
  },
  first_message_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  last_message_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    required: true,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Índices compuestos para consultas eficientes
AIConversationSchema.index({ user_id: 1, last_message_at: -1 });
AIConversationSchema.index({ is_active: 1, last_message_at: -1 });
AIConversationSchema.index({ 'messages.analysis_id': 1 });

// Middleware para actualizar updated_at y contadores
AIConversationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Actualizar contadores automáticamente
  this.total_messages = this.messages.length;
  this.ai_responses_count = this.messages.filter(msg => msg.is_ai_response).length;
  this.user_messages_count = this.messages.filter(msg => !msg.is_ai_response).length;
  
  // Actualizar timestamps
  if (this.messages.length > 0) {
    this.first_message_at = this.messages[0].timestamp;
    this.last_message_at = this.messages[this.messages.length - 1].timestamp;
  }
  
  next();
});

// Método estático para crear una nueva conversación
AIConversationSchema.statics.createConversation = function(userId: string, conversationId: string) {
  return this.create({
    user_id: userId,
    conversation_id: conversationId,
    messages: [],
    total_messages: 0,
    ai_responses_count: 0,
    user_messages_count: 0,
    is_active: true
  });
};

// Método de instancia para agregar un mensaje
AIConversationSchema.methods.addMessage = function(messageId: string, content: string, isAIResponse: boolean, analysisId?: string) {
  this.messages.push({
    id: messageId,
    content: content,
    is_ai_response: isAIResponse,
    timestamp: new Date(),
    analysis_id: analysisId
  });
  
  return this.save();
};

// Método de instancia para obtener el historial de mensajes
AIConversationSchema.methods.getMessages = function(limit?: number) {
  if (limit) {
    return this.messages.slice(-limit);
  }
  return this.messages;
};

export const AIConversationModel = mongoose.model<IAIConversationDocument>('AIConversation', AIConversationSchema); 