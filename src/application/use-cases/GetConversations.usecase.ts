import { ConversationRepository } from '@domain/repositories/ConversationRepository.interface';
import { ChatRepository } from '@domain/repositories/ChatRepository.interface';
import { ConversationResponse } from '@shared/types/response.types';

export interface GetConversationsRequest {
  usuario_id: string;
  page?: number;
  limit?: number;
}

export class GetConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(request: GetConversationsRequest): Promise<ConversationResponse> {
    try {
      console.log(`📋 Obteniendo conversaciones para usuario: ${request.usuario_id}`);

      const page = request.page || 1;
      const limit = Math.min(request.limit || 20, 50); // Máximo 50 conversaciones por página
      const skip = (page - 1) * limit;

      // Obtener conversaciones del usuario
      const conversations = await this.conversationRepository.findByParticipant(
        request.usuario_id,
        limit + 1 // +1 para saber si hay más páginas
      );

      const hasMore = conversations.length > limit;
      const conversationsToReturn = hasMore ? conversations.slice(0, limit) : conversations;

      // Calcular información de paginación
      const total = await this.getTotalConversations(request.usuario_id);
      const totalPages = Math.ceil(total / limit);

      return {
        conversations: conversationsToReturn.map(conversation => ({
          id: conversation.id,
          participant1_id: conversation.participant1_id,
          participant2_id: conversation.participant2_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          is_active: conversation.is_active,
          last_message_at: conversation.last_message_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: hasMore,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error en GetConversationsUseCase:', error);
      throw new Error('Error al obtener conversaciones del usuario');
    }
  }

  private async getTotalConversations(userId: string): Promise<number> {
    try {
      // Esta es una implementación simplificada
      // En un entorno de producción, podrías usar un contador separado o una consulta más eficiente
      const conversations = await this.conversationRepository.findByParticipant(userId, 1000);
      return conversations.length;
    } catch (error) {
      console.error('Error obteniendo total de conversaciones:', error);
      return 0;
    }
  }
} 