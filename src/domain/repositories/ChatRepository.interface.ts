import { ChatHistory } from '@domain/entities/ChatHistory.entity';
import { PaginationMeta } from '@shared/types/response.types';

export interface ChatFilters {
  usuario_id?: string;
  is_ai_response?: boolean;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  page?: number;
  limit?: number;
}

export interface ChatRepository {
  // Operaciones básicas CRUD
  save(chatHistory: ChatHistory): Promise<ChatHistory>;
  findById(id: string): Promise<ChatHistory | null>;
  update(chatHistory: ChatHistory): Promise<ChatHistory>;
  delete(id: string): Promise<void>;

  // Búsquedas específicas
  findByUserId(userId: string, limit?: number): Promise<ChatHistory[]>;
  findConversationHistory(userId: string, filters?: ChatFilters): Promise<{
    messages: ChatHistory[];
    pagination: PaginationMeta;
  }>;

  // Búsquedas con filtros avanzados
  findWithFilters(filters: ChatFilters): Promise<{
    messages: ChatHistory[];
    pagination: PaginationMeta;
  }>;

  // Operaciones de estado
  markAsRead(messageIds: string[]): Promise<void>;
  markAsDelivered(messageIds: string[]): Promise<void>;

  // Estadísticas y análisis
  countMessagesByUser(userId: string, days?: number): Promise<number>;
  findLastMessage(userId: string): Promise<ChatHistory | null>;
  findResponseToMessage(messageId: string): Promise<ChatHistory | null>;

  // Gestión de conversaciones
  findRecentConversations(userId: string, limit?: number): Promise<ChatHistory[]>;
  deleteConversation(userId: string): Promise<void>;
  
  // Búsquedas por conversación
  findByConversationId(conversationId: string, limit?: number, skip?: number): Promise<ChatHistory[]>;

  // Obtener todos los mensajes de todos los usuarios
  findAllMessages(page?: number, limit?: number): Promise<{
    messages: ChatHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
} 