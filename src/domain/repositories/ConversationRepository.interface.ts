import { Conversation } from '@domain/entities/Conversation.entity';

export interface ConversationRepository {
  // Crear o encontrar conversación entre dos usuarios
  findOrCreateConversation(participant1_id: string, participant2_id: string): Promise<Conversation>;
  
  // Obtener conversación por ID
  findById(conversationId: string): Promise<Conversation | null>;
  
  // Obtener conversaciones de un usuario
  findByParticipant(userId: string, limit?: number): Promise<Conversation[]>;
  
  // Obtener conversación entre dos usuarios específicos
  findByParticipants(participant1_id: string, participant2_id: string): Promise<Conversation | null>;
  
  // Guardar conversación
  save(conversation: Conversation): Promise<Conversation>;
  
  // Actualizar timestamp del último mensaje
  updateLastMessage(conversationId: string): Promise<Conversation>;
  
  // Desactivar conversación
  deactivate(conversationId: string): Promise<Conversation>;
  
  // Eliminar conversación
  delete(conversationId: string): Promise<boolean>;

  // Obtener todas las conversaciones de todos los usuarios
  findAllConversations(page?: number, limit?: number): Promise<{
    conversations: Conversation[];
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