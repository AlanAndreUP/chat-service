import { ChatAttemptCounter } from '../entities/ChatAttempts.entity';

export interface ChatAttemptsRepository {
  increment(usuario_id: string, conversation_id: string | undefined, fecha: Date): Promise<ChatAttemptCounter>;
  getByUserAndDate(usuario_id: string, fecha: Date): Promise<ChatAttemptCounter | null>;
  getByConversationAndDate(conversation_id: string, fecha: Date): Promise<ChatAttemptCounter | null>;
  getAllByUser(usuario_id: string): Promise<ChatAttemptCounter[]>;
} 