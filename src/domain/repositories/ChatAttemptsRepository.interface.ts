import { ChatAttemptCounter } from '../entities/ChatAttempts.entity';

export interface AttemptMessageRequest {
  usuario_id: string;
  conversation_id?: string;
  fecha?: Date;
}

export interface AttemptMessageResponse {
  attempt: ReturnType<ChatAttemptCounter['toJSON']>;
}

export interface ChatAttemptFilters {
  usuario_id: string;
  conversation_id?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  page?: number;
  limit?: number;
}

export interface ChatAttemptsRepository {
  increment(usuario_id: string, conversation_id: string | undefined, fecha: Date): Promise<ChatAttemptCounter>;
  getByUserAndDate(usuario_id: string, fecha: Date): Promise<ChatAttemptCounter | null>;
  getByConversationAndDate(conversation_id: string, fecha: Date): Promise<ChatAttemptCounter | null>;
  getAllByUser(filters: ChatAttemptFilters): Promise<{ attempts: ChatAttemptCounter[]; total: number; }>;
} 