import { ChatRepository, ChatFilters } from '@domain/repositories/ChatRepository.interface';
import { ChatAttemptFilters, ChatAttemptsRepository } from '@domain/repositories/ChatAttemptsRepository.interface';
import { GetChatHistoryRequest, ChatHistoryResponse } from '@shared/types/response.types';

export class GetChatHistoryUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly attemptsRepository: ChatAttemptsRepository
  ) {}

  async execute(request: GetChatHistoryRequest): Promise<ChatHistoryResponse> {
    try {
      console.log(`📜 Obteniendo historial de chat para estudiante: ${request.estudiante_id}`);

      // Construir filtros para la búsqueda
      const filters: ChatFilters = {
        usuario_id: request.estudiante_id,
        page: request.page || 1,
        limit: request.limit || 20
      };

      // Agregar filtros de fecha si están presentes
      if (request.fecha_desde) {
        filters.fecha_desde = new Date(request.fecha_desde);
      }

      if (request.fecha_hasta) {
        filters.fecha_hasta = new Date(request.fecha_hasta);
      }

      // Obtener mensajes del historial
      const conversationResult = await this.chatRepository.findConversationHistory(
        request.estudiante_id,
        filters
      );

      console.log(`✅ Obtenidos ${conversationResult.messages.length} mensajes del historial`);

      // Mapear mensajes a formato de respuesta
      const formattedMessages = conversationResult.messages.map(message => ({
        id: message.id,
        mensaje: message.mensaje,
        estado: message.estado,
        fecha: message.fecha,
        usuario_id: message.usuario_id,
        created_at: message.created_at,
        updated_at: message.updated_at,
        is_ai_response: message.is_ai_response,
        response_to_message_id: message.response_to_message_id
      }));

      const attempts_filters: ChatAttemptFilters = {
        usuario_id: request.estudiante_id,
        page: request.page || 1,
        limit: request.limit || 20
      };

      // Obtener todos los intentos del usuario
      const attempts = await this.attemptsRepository.getAllByUser(attempts_filters);

      return {
        messages: formattedMessages,
        attempts: attempts.attempts.map(a => a.toJSON()),
        pagination: {
          page: request.page || 1,
          limit: request.limit || 20,
          total: attempts.total,
          totalPages: Math.ceil(attempts.total / (request.limit || 20)),
          hasNext: (request.page && request.page < Math.ceil(attempts.total / (request.limit || 20))) || false,
          hasPrev: (request.page && request.page > 1) || false
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo historial de chat:', error);
      throw new Error('Error al obtener el historial de chat');
    }
  }

  // Método para obtener solo mensajes sin intentos
  async getMessagesOnly(request: GetChatHistoryRequest): Promise<{
    messages: any[];
    pagination: any;
  }> {
    try {
      const filters: ChatFilters = {
        usuario_id: request.estudiante_id,
        page: request.page || 1,
        limit: request.limit || 20
      };

      if (request.fecha_desde) {
        filters.fecha_desde = new Date(request.fecha_desde);
      }

      if (request.fecha_hasta) {
        filters.fecha_hasta = new Date(request.fecha_hasta);
      }

      const result = await this.chatRepository.findConversationHistory(
        request.estudiante_id,
        filters
      );

      const formattedMessages = result.messages.map(message => ({
        id: message.id,
        mensaje: message.mensaje,
        estado: message.estado,
        fecha: message.fecha,
        usuario_id: message.usuario_id,
        created_at: message.created_at,
        updated_at: message.updated_at,
        is_ai_response: message.is_ai_response,
        response_to_message_id: message.response_to_message_id
      }));

      return {
        messages: formattedMessages,
        pagination: result.pagination
      };

    } catch (error) {
      console.error('❌ Error obteniendo solo mensajes:', error);
      throw new Error('Error al obtener mensajes');
    }
  }

  // Método para obtener solo mensajes de usuario (sin IA)
  async getUserMessagesOnly(request: GetChatHistoryRequest): Promise<{
    messages: any[];
    pagination: any;
  }> {
    try {
      const filters: ChatFilters = {
        usuario_id: request.estudiante_id,
        is_ai_response: false, // Solo mensajes de usuario
        page: request.page || 1,
        limit: request.limit || 20
      };

      if (request.fecha_desde) {
        filters.fecha_desde = new Date(request.fecha_desde);
      }

      if (request.fecha_hasta) {
        filters.fecha_hasta = new Date(request.fecha_hasta);
      }

      const result = await this.chatRepository.findConversationHistory(
        request.estudiante_id,
        filters
      );

      const formattedMessages = result.messages.map(message => ({
        id: message.id,
        mensaje: message.mensaje,
        estado: message.estado,
        fecha: message.fecha,
        usuario_id: message.usuario_id,
        created_at: message.created_at,
        updated_at: message.updated_at,
        is_ai_response: message.is_ai_response,
        response_to_message_id: message.response_to_message_id
      }));

      return {
        messages: formattedMessages,
        pagination: result.pagination
      };

    } catch (error) {
      console.error('❌ Error obteniendo mensajes de usuario:', error);
      throw new Error('Error al obtener mensajes de usuario');
    }
  }

  // Método para obtener solo respuestas de IA
  async getAIMessagesOnly(request: GetChatHistoryRequest): Promise<{
    messages: any[];
    pagination: any;
  }> {
    try {
      const filters: ChatFilters = {
        usuario_id: request.estudiante_id,
        is_ai_response: true, // Solo respuestas de IA
        page: request.page || 1,
        limit: request.limit || 20
      };

      // Nota: Para respuestas de IA, buscamos por 'ai-system' como usuario_id
      filters.usuario_id = 'ai-system';
      
      if (request.fecha_desde) {
        filters.fecha_desde = new Date(request.fecha_desde);
      }

      if (request.fecha_hasta) {
        filters.fecha_hasta = new Date(request.fecha_hasta);
      }

      const result = await this.chatRepository.findWithFilters(filters);

      const formattedMessages = result.messages.map(message => ({
        id: message.id,
        mensaje: message.mensaje,
        estado: message.estado,
        fecha: message.fecha,
        usuario_id: message.usuario_id,
        created_at: message.created_at,
        updated_at: message.updated_at,
        is_ai_response: message.is_ai_response,
        response_to_message_id: message.response_to_message_id
      }));

      return {
        messages: formattedMessages,
        pagination: result.pagination
      };

    } catch (error) {
      console.error('❌ Error obteniendo respuestas de IA:', error);
      throw new Error('Error al obtener respuestas de IA');
    }
  }
} 