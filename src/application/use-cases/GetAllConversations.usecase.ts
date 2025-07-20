import { ConversationRepository } from '@domain/repositories/ConversationRepository.interface';
import { Conversation } from '@domain/entities/Conversation.entity';

export interface GetAllConversationsRequest {
  page?: number;
  limit?: number;
}

export interface GetAllConversationsResponse {
  conversations: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class GetAllConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(request: GetAllConversationsRequest): Promise<GetAllConversationsResponse> {
    try {
      const { page = 1, limit = 50 } = request;

      const result = await this.conversationRepository.findAllConversations(page, limit);

      return {
        conversations: result.conversations.map((conversation: Conversation) => ({
          id: conversation.id,
          participant1_id: conversation.participant1_id,
          participant2_id: conversation.participant2_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          is_active: conversation.is_active,
          last_message_at: conversation.last_message_at
        })),
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error en GetAllConversationsUseCase:', error);
      throw new Error('Error al obtener todas las conversaciones');
    }
  }
} 