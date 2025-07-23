import { Router } from 'express';
import { ConversationController } from '@infrastructure/controllers/Conversation.controller';
import { SendPrivateMessageUseCase } from '@application/use-cases/SendPrivateMessage.usecase';
import { GetConversationsUseCase } from '@application/use-cases/GetConversations.usecase';
import { GetConversationMessagesUseCase } from '@application/use-cases/GetConversationMessages.usecase';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { MongoConversationRepository } from '@infrastructure/repositories/MongoConversationRepository';
import { EmailService } from '@application/services/EmailService';
import { GeminiAIService } from '@application/services/GeminiAI.service';

export function createConversationRoutes(): Router {
  const router = Router();
  
  // Dependencias
  const chatRepository = new MongoChatRepository();
  const conversationRepository = new MongoConversationRepository();
  const emailService = new EmailService();
  const geminiService = new GeminiAIService();
  
  // Casos de uso
  const sendPrivateMessageUseCase = new SendPrivateMessageUseCase(chatRepository, conversationRepository, emailService, geminiService);
  const getConversationsUseCase = new GetConversationsUseCase(conversationRepository, chatRepository);
  const getConversationMessagesUseCase = new GetConversationMessagesUseCase(conversationRepository, chatRepository);
  
  // Controlador
  const conversationController = new ConversationController(
    sendPrivateMessageUseCase,
    getConversationsUseCase,
    getConversationMessagesUseCase
  );

  // ============================================================================
  // RUTAS DE CONVERSACIONES 1 A 1
  // ============================================================================

  /**
   * POST /conversations/message
   * Enviar mensaje privado a otro usuario
   */
  router.post('/message', conversationController.sendPrivateMessage);

  /**
   * GET /conversations/:usuario_id
   * Obtener conversaciones de un usuario
   */
  router.get('/:usuario_id', conversationController.getConversations);

  /**
   * GET /conversations/:conversation_id/messages
   * Obtener mensajes de una conversación específica
   */
  router.get('/:conversation_id/messages', conversationController.getConversationMessages);

  // ============================================================================
  // RUTAS DE ESTADO Y HEALTH CHECK
  // ============================================================================

  /**
   * @swagger
   * /conversations/status:
   *   get:
   *     summary: Estado del servicio de conversaciones
   *     description: Verifica el estado del servicio de conversaciones 1 a 1
   *     tags: [Conversations]
   *     responses:
   *       200:
   *         description: Estado del servicio obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     service:
   *                       type: string
   *                       example: "conversation-service"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     features:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["Mensajes privados 1 a 1", "Gestión de conversaciones", "Historial de mensajes", "Marcado de mensajes leídos", "Paginación de conversaciones"]
   *                     limits:
   *                       type: object
   *                       properties:
   *                         maxMessageLength:
   *                           type: integer
   *                           example: 5000
   *                         maxConversationsPerPage:
   *                           type: integer
   *                           example: 50
   *                         maxMessagesPerPage:
   *                           type: integer
   *                           example: 100
   *                 message:
   *                   type: string
   *                   example: "Servicio de conversaciones funcionando correctamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       500:
   *         description: Error verificando estado del servicio de conversaciones
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/status', async (req, res) => {
    try {
      res.json({
        data: {
          service: 'conversation-service',
          timestamp: new Date().toISOString(),
          features: [
            'Mensajes privados 1 a 1',
            'Gestión de conversaciones',
            'Historial de mensajes',
            'Marcado de mensajes leídos',
            'Paginación de conversaciones'
          ],
          limits: {
            maxMessageLength: 5000,
            maxConversationsPerPage: 50,
            maxMessagesPerPage: 100
          }
        },
        message: 'Servicio de conversaciones funcionando correctamente',
        status: 'success'
      });
    } catch (error) {
      console.error('Error in conversation status check:', error);
      res.status(500).json({
        data: null,
        message: 'Error verificando estado del servicio de conversaciones',
        status: 'error'
      });
    }
  });

  return router;
} 