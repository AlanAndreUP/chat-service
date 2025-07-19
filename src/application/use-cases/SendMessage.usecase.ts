import { ChatRepository } from '@domain/repositories/ChatRepository.interface';
import { ChatHistory } from '@domain/entities/ChatHistory.entity';
import { GeminiAIService, GeminiRequest } from '@application/services/GeminiAI.service';
import { SendMessageRequest, SendMessageResponse } from '@shared/types/response.types';

export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly geminiService: GeminiAIService
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log(`💬 Procesando mensaje de usuario: ${request.usuario_id}`);

      // 1. Crear y guardar mensaje del usuario
      const userMessage = ChatHistory.create(
        request.mensaje,
        request.usuario_id,
        false // is_ai_response = false para mensajes de usuario
      );

      const savedUserMessage = await this.chatRepository.save(userMessage);
      console.log(`✅ Mensaje de usuario guardado: ${savedUserMessage.id}`);

      // 2. Obtener historial de conversación para contexto
      const conversationHistory = await this.chatRepository.findByUserId(
        request.usuario_id,
        10 // Últimos 10 mensajes para contexto
      );

      // 3. Generar respuesta con IA
      console.log(`🤖 Generando respuesta IA...`);
      const geminiRequest: GeminiRequest = {
        userMessage: request.mensaje,
        userId: request.usuario_id,
        conversationHistory: conversationHistory
      };

      const aiResponse = await this.geminiService.generateResponse(geminiRequest);
      console.log(`✅ Respuesta IA generada: ${aiResponse.response.substring(0, 100)}...`);

      // 4. Crear y guardar mensaje de respuesta de IA
      const aiMessage = ChatHistory.create(
        aiResponse.response,
        'ai-system', // ID especial para el sistema de IA
        true, // is_ai_response = true
        savedUserMessage.id // response_to_message_id
      );

      const savedAiMessage = await this.chatRepository.save(aiMessage);
      console.log(`✅ Respuesta IA guardada: ${savedAiMessage.id}`);

      // 5. Marcar mensaje del usuario como entregado
      await this.chatRepository.markAsDelivered([savedUserMessage.id]);

      // 6. Retornar ambos mensajes
      return {
        message: {
          id: savedUserMessage.id,
          mensaje: savedUserMessage.mensaje,
          estado: savedUserMessage.estado,
          fecha: savedUserMessage.fecha,
          usuario_id: savedUserMessage.usuario_id,
          created_at: savedUserMessage.created_at,
          updated_at: savedUserMessage.updated_at,
          is_ai_response: savedUserMessage.is_ai_response,
          response_to_message_id: savedUserMessage.response_to_message_id
        },
        ai_response: {
          id: savedAiMessage.id,
          mensaje: savedAiMessage.mensaje,
          estado: savedAiMessage.estado,
          fecha: savedAiMessage.fecha,
          usuario_id: savedAiMessage.usuario_id,
          created_at: savedAiMessage.created_at,
          updated_at: savedAiMessage.updated_at,
          is_ai_response: savedAiMessage.is_ai_response,
          response_to_message_id: savedAiMessage.response_to_message_id
        }
      };

    } catch (error) {
      console.error('❌ Error en SendMessageUseCase:', error);
      
      // Si hay error, intentar guardar al menos el mensaje del usuario
      try {
        const userMessage = ChatHistory.create(
          request.mensaje,
          request.usuario_id,
          false
        );
        const savedUserMessage = await this.chatRepository.save(userMessage);

        // Crear respuesta de error
        const errorMessage = ChatHistory.create(
          'Lo siento, tuve problemas técnicos procesando tu mensaje. ¿Podrías intentar de nuevo?',
          'ai-system',
          true,
          savedUserMessage.id
        );
        const savedErrorMessage = await this.chatRepository.save(errorMessage);

        return {
          message: {
            id: savedUserMessage.id,
            mensaje: savedUserMessage.mensaje,
            estado: savedUserMessage.estado,
            fecha: savedUserMessage.fecha,
            usuario_id: savedUserMessage.usuario_id,
            created_at: savedUserMessage.created_at,
            updated_at: savedUserMessage.updated_at,
            is_ai_response: savedUserMessage.is_ai_response,
            response_to_message_id: savedUserMessage.response_to_message_id
          },
          ai_response: {
            id: savedErrorMessage.id,
            mensaje: savedErrorMessage.mensaje,
            estado: savedErrorMessage.estado,
            fecha: savedErrorMessage.fecha,
            usuario_id: savedErrorMessage.usuario_id,
            created_at: savedErrorMessage.created_at,
            updated_at: savedErrorMessage.updated_at,
            is_ai_response: savedErrorMessage.is_ai_response,
            response_to_message_id: savedErrorMessage.response_to_message_id
          }
        };
      } catch (saveError) {
        console.error('❌ Error crítico guardando mensaje:', saveError);
        throw new Error('Error interno del servidor de chat');
      }
    }
  }

  // Método auxiliar para validar el mensaje
  private validateMessage(message: string): boolean {
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    if (message.length > 5000) {
      throw new Error('El mensaje es demasiado largo (máximo 5000 caracteres)');
    }

    return true;
  }

  // Método auxiliar para validar usuario
  private validateUser(userId: string): boolean {
    if (!userId || userId.trim().length === 0) {
      throw new Error('ID de usuario requerido');
    }

    return true;
  }
} 