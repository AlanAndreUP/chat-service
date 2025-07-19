import { ConversationRepository } from '@domain/repositories/ConversationRepository.interface';
import { ChatRepository } from '@domain/repositories/ChatRepository.interface';
import { ConversationMessagesResponse } from '@shared/types/response.types';

export interface GetConversationMessagesRequest {
  conversation_id: string;
  usuario_id: string; // Para verificar que el usuario tiene acceso a la conversación
  page?: number;
  limit?: number;
}

export class GetConversationMessagesUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(request: GetConversationMessagesRequest): Promise<ConversationMessagesResponse> {
    try {
      console.log(`💬 Obteniendo mensajes de conversación: ${request.conversation_id}`);

      // 1. Verificar que la conversación existe y el usuario tiene acceso
      const conversation = await this.conversationRepository.findById(request.conversation_id);
      
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      if (!conversation.isParticipant(request.usuario_id)) {
        throw new Error('No tienes acceso a esta conversación');
      }

      const page = request.page || 1;
      const limit = Math.min(request.limit || 50, 100); // Máximo 100 mensajes por página
      const skip = (page - 1) * limit;

      // 2. Obtener mensajes de la conversación
      const messages = await this.chatRepository.findByConversationId(
        request.conversation_id,
        limit + 1, // +1 para saber si hay más páginas
        skip
      );

      const hasMore = messages.length > limit;
      const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

      // 3. Calcular información de paginación
      const total = await this.getTotalMessages(request.conversation_id);
      const totalPages = Math.ceil(total / limit);

      // 4. Marcar mensajes como leídos si el usuario es el destinatario
      const unreadMessages = messagesToReturn.filter(
        (msg: any) => msg.recipient_id === request.usuario_id && msg.estado !== 'leido'
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg: any) => msg.id);
        await this.chatRepository.markAsRead(messageIds);
      }

      return {
        conversation: {
          id: conversation.id,
          participant1_id: conversation.participant1_id,
          participant2_id: conversation.participant2_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          is_active: conversation.is_active,
          last_message_at: conversation.last_message_at
        },
        messages: messagesToReturn.map((message: any) => ({
          id: message.id,
          mensaje: message.mensaje,
          estado: message.estado,
          fecha: message.fecha,
          usuario_id: message.usuario_id,
          created_at: message.created_at,
          updated_at: message.updated_at,
          is_ai_response: message.is_ai_response,
          response_to_message_id: message.response_to_message_id,
          conversation_id: message.conversation_id,
          recipient_id: message.recipient_id
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
      console.error('❌ Error en GetConversationMessagesUseCase:', error);
      throw new Error('Error al obtener mensajes de la conversación');
    }
  }

  private async getTotalMessages(conversationId: string): Promise<number> {
    try {
      // Esta es una implementación simplificada
      // En un entorno de producción, podrías usar un contador separado o una consulta más eficiente
      const messages = await this.chatRepository.findByConversationId(conversationId, 1000);
      return messages.length;
    } catch (error) {
      console.error('Error obteniendo total de mensajes:', error);
      return 0;
    }
  }
} 