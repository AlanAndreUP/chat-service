import { ChatRepository } from '@domain/repositories/ChatRepository.interface';
import { ConversationRepository } from '@domain/repositories/ConversationRepository.interface';
import { ChatHistory } from '@domain/entities/ChatHistory.entity';
import { EmailService, EmailAlertData } from '@application/services/EmailService';
import { GeminiAIService } from '@application/services/GeminiAI.service';
import { SendMessageRequest, SendMessageResponse } from '@shared/types/response.types';

export class SendPrivateMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly emailService: EmailService,
    private readonly geminiService: GeminiAIService
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log(`💬 Procesando mensaje privado de ${request.usuario_id} a ${request.recipient_id}`);

      // Validar que se proporcione un destinatario
      if (!request.recipient_id) {
        throw new Error('Se requiere un destinatario para mensajes privados');
      }

      // Validar que no se envíe mensaje a sí mismo
      if (request.usuario_id === request.recipient_id) {
        throw new Error('No puedes enviar mensajes a ti mismo');
      }

      // 1. Encontrar o crear conversación entre los usuarios
      const conversation = await this.conversationRepository.findOrCreateConversation(
        request.usuario_id,
        request.recipient_id
      );

      console.log(`✅ Conversación encontrada/creada: ${conversation.id}`);

      // 2. Crear y guardar mensaje del usuario
      const userMessage = ChatHistory.create(
        request.mensaje,
        request.usuario_id,
        false, // is_ai_response = false para mensajes de usuario
        undefined, // response_to_message_id
        conversation.id, // conversation_id
        request.recipient_id // recipient_id
      );

      const savedUserMessage = await this.chatRepository.save(userMessage);
      console.log(`✅ Mensaje privado guardado: ${savedUserMessage.id}`);

      // 3. Actualizar timestamp del último mensaje en la conversación
      await this.conversationRepository.updateLastMessage(conversation.id);

      // 4. Marcar mensaje como entregado
      await this.chatRepository.markAsDelivered([savedUserMessage.id]);

      // 5. Enviar alerta por email (en paralelo, sin esperar)
      this.sendEmailAlert(request, conversation.id, false).catch(error => {
        console.error('❌ Error enviando email de alerta:', error);
      });

      // 6. Retornar el mensaje enviado
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
          response_to_message_id: savedUserMessage.response_to_message_id,
          conversation_id: savedUserMessage.conversation_id,
          recipient_id: savedUserMessage.recipient_id
        }
      };

    } catch (error) {
      console.error('❌ Error en SendPrivateMessageUseCase:', error);
      
      // Si hay error, intentar guardar al menos el mensaje del usuario
      try {
        if (request.recipient_id) {
          const conversation = await this.conversationRepository.findOrCreateConversation(
            request.usuario_id,
            request.recipient_id
          );

          const userMessage = ChatHistory.create(
            request.mensaje,
            request.usuario_id,
            false,
            undefined,
            conversation.id,
            request.recipient_id
          );
          
          const savedUserMessage = await this.chatRepository.save(userMessage);

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
              response_to_message_id: savedUserMessage.response_to_message_id,
              conversation_id: savedUserMessage.conversation_id,
              recipient_id: savedUserMessage.recipient_id
            }
          };
        }
      } catch (saveError) {
        console.error('❌ Error crítico guardando mensaje privado:', saveError);
      }
      
      throw new Error('Error interno del servidor de chat privado');
    }
  }

  private async sendEmailAlert(request: SendMessageRequest, conversationId: string, isToAI: boolean): Promise<void> {
    try {
      // Analizar el contexto del mensaje
      const analysis = await this.geminiService.analyzeConversationContext([request.mensaje]);

      const emailData: EmailAlertData = {
        senderId: request.usuario_id,
        recipientId: request.recipient_id || 'unknown',
        message: request.mensaje,
        conversationId: conversationId,
        isToAI: isToAI,
        analysis: analysis
      };

      await this.emailService.sendMessageAlert(emailData);
    } catch (error) {
      console.error('❌ Error en sendEmailAlert:', error);
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