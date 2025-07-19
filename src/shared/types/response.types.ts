export interface ApiResponse<T = any> {
  data: T;
  message: string;
  status: 'success' | 'error';
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  data: null;
  message: string;
  status: 'error';
  error?: {
    code: string;
    details?: any;
  };
}

// Tipos de Chat
export type EstadoMensaje = 'enviado' | 'entregado' | 'leido' | 'fallido';

export interface ChatMessage {
  id: string;
  mensaje: string;
  estado: EstadoMensaje;
  fecha: Date;
  usuario_id: string;
  created_at: Date;
  updated_at: Date;
  is_ai_response?: boolean;
  response_to_message_id?: string;
  conversation_id?: string;
  recipient_id?: string;
}

export interface ChatAttempt {
  id: string;
  open_without_send: number;
  chat_estudiante_id: string;
  created_at: Date;
}

export interface ChatPorEstudiante {
  id: string;
  chat_id: string;
  estudiante_id: string;
  created_at: Date;
}

// Requests y Responses
export interface SendMessageRequest {
  mensaje: string;
  usuario_id: string;
  chat_estudiante_id?: string;
  recipient_id?: string; // Para chats 1 a 1
  conversation_id?: string; // Para continuar una conversación existente
}

export interface SendMessageResponse {
  message: ChatMessage;
  ai_response?: ChatMessage;
}

export interface GetChatHistoryRequest {
  estudiante_id: string;
  page?: number;
  limit?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface RecordAttemptRequest {
  estudiante_id: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_message_at?: Date;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  attempts: ChatAttempt[];
  pagination: PaginationMeta;
}

export interface ConversationResponse {
  conversations: Conversation[];
  pagination: PaginationMeta;
}

export interface ConversationMessagesResponse {
  conversation: Conversation;
  messages: ChatMessage[];
  pagination: PaginationMeta;
}

// WebSocket Events
export interface SocketAuthData {
  token: string;
  userId: string;
}

export interface SocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'user_joined' | 'user_left' | 'private_message';
  data: any;
  timestamp: Date;
  from: string;
  to?: string; // Para mensajes privados
  conversation_id?: string; // Para mensajes de conversación específica
}

export interface TypingData {
  userId: string;
  isTyping: boolean;
} 