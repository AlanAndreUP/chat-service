import { ChatRepository } from '@domain/repositories/ChatRepository.interface';
import { ChatHistory } from '@domain/entities/ChatHistory.entity';

export interface GetAllMessagesRequest {
  page?: number;
  limit?: number;
}

export interface GetAllMessagesResponse {
  messages: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class GetAllMessagesUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(request: GetAllMessagesRequest): Promise<GetAllMessagesResponse> {
    try {
      const { page = 1, limit = 50 } = request;

      const result = await this.chatRepository.findAllMessages(page, limit);

      return {
        messages: result.messages.map((message: ChatHistory) => ({
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
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error en GetAllMessagesUseCase:', error);
      throw new Error('Error al obtener todos los mensajes');
    }
  }
} 