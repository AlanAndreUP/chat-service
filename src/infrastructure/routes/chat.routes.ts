import { Router } from 'express';
import { ChatController } from '@infrastructure/controllers/Chat.controller';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistory.usecase';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { GeminiAIService } from '@application/services/GeminiAI.service';

// Simulamos el repositorio de intentos por ahora
class MockChatAttemptsRepository {
  async incrementAttempt() { return {} as any; }
  async findById() { return null; }
  async save() { return {} as any; }
  async findByStudentChat() { return []; }
  async getAttemptStats() { return null; }
  async getTotalAttempts() { return 0; }
  async deleteOldAttempts() { return 0; }
  async deleteByStudentChat() { return; }
}

export function createChatRoutes(): Router {
  const router = Router();
  
  // Dependencias
  const chatRepository = new MongoChatRepository();
  const attemptsRepository = new MockChatAttemptsRepository();
  const geminiService = new GeminiAIService();
  
  // Casos de uso
  const sendMessageUseCase = new SendMessageUseCase(chatRepository, geminiService);
  const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository, attemptsRepository);
  
  // Controlador
  const chatController = new ChatController(sendMessageUseCase, getChatHistoryUseCase);

  // ============================================================================
  // RUTAS DE CHAT
  // ============================================================================

  /**
   * POST /chat/message
   * Enviar mensaje de chat y obtener respuesta de IA automática
   */
  router.post('/message', chatController.sendMessage);

  /**
   * GET /chat/history/:estudiante_id
   * Obtener historial completo de chat de un estudiante
   */
  router.get('/history/:estudiante_id', chatController.getChatHistory);

  /**
   * GET /chat/history/:estudiante_id/messages
   * Obtener solo mensajes (sin intentos) - Más rápido
   */
  router.get('/history/:estudiante_id/messages', chatController.getMessagesOnly);

  /**
   * POST /chat/attempt
   * Registrar intento de chat (cuando se abre el input sin enviar)
   */
  router.post('/attempt', chatController.recordAttempt);

  /**
   * GET /chat/attempts/:estudiante_id
   * Obtener intentos de chat de un estudiante
   */
  router.get('/attempts/:estudiante_id', chatController.getAttempts);

  // ============================================================================
  // RUTAS DE ESTADO Y HEALTH CHECK
  // ============================================================================

  /**
   * @swagger
   * /chat/status:
   *   get:
   *     summary: Estado del servicio de chat y IA
   *     description: Verifica el estado del servicio de chat y la integración con Gemini IA
   *     tags: [Chat]
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
   *                       example: "chat-service"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     ai:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           enum: [healthy, unhealthy]
   *                           example: "healthy"
   *                         model:
   *                           type: string
   *                           example: "gemini-pro"
   *                         provider:
   *                           type: string
   *                           example: "Google"
   *                         version:
   *                           type: string
   *                           example: "1.0.0"
   *                     database:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: "connected"
   *                     websockets:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: "running"
   *                 message:
   *                   type: string
   *                   example: "Servicio de chat funcionando correctamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       500:
   *         description: Error verificando estado del servicio
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/status', async (req, res) => {
    try {
      // Health check de Gemini IA
      const aiHealthy = await geminiService.isServiceHealthy();
      const aiInfo = geminiService.getModelInfo();

      res.json({
        data: {
          service: 'chat-service',
          timestamp: new Date().toISOString(),
          ai: {
            status: aiHealthy ? 'healthy' : 'unhealthy',
            model: aiInfo.model,
            provider: aiInfo.provider,
            version: aiInfo.version
          },
          database: {
            status: 'connected' // TODO: Verificar conexión real
          },
          websockets: {
            status: 'running'
          }
        },
        message: 'Servicio de chat funcionando correctamente',
        status: 'success'
      });
    } catch (error) {
      console.error('Error in chat status check:', error);
      res.status(500).json({
        data: null,
        message: 'Error verificando estado del servicio',
        status: 'error'
      });
    }
  });

  /**
   * @swagger
   * /chat/ai/info:
   *   get:
   *     summary: Información del modelo de IA
   *     description: Obtiene información detallada sobre el modelo de IA configurado
   *     tags: [Chat]
   *     responses:
   *       200:
   *         description: Información de IA obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     ai:
   *                       type: object
   *                       properties:
   *                         model:
   *                           type: string
   *                           example: "gemini-pro"
   *                         provider:
   *                           type: string
   *                           example: "Google"
   *                         version:
   *                           type: string
   *                           example: "1.0.0"
   *                     capabilities:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["Respuestas en tiempo real", "Contexto de conversación", "Especialización educativa", "Respuestas en español", "Manejo de errores gracioso"]
   *                     limits:
   *                       type: object
   *                       properties:
   *                         maxTokensPerResponse:
   *                           type: integer
   *                           example: 1024
   *                         contextMessages:
   *                           type: integer
   *                           example: 10
   *                         maxMessageLength:
   *                           type: integer
   *                           example: 5000
   *                 message:
   *                   type: string
   *                   example: "Información de IA obtenida exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       500:
   *         description: Error obteniendo información de IA
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/ai/info', (req, res) => {
    try {
      const aiInfo = geminiService.getModelInfo();
      
      res.json({
        data: {
          ai: aiInfo,
          capabilities: [
            'Respuestas en tiempo real',
            'Contexto de conversación',
            'Especialización educativa',
            'Respuestas en español',
            'Manejo de errores gracioso'
          ],
          limits: {
            maxTokensPerResponse: 1024,
            contextMessages: 10,
            maxMessageLength: 5000
          }
        },
        message: 'Información de IA obtenida exitosamente',
        status: 'success'
      });
    } catch (error) {
      console.error('Error getting AI info:', error);
      res.status(500).json({
        data: null,
        message: 'Error obteniendo información de IA',
        status: 'error'
      });
    }
  });

  /**
   * @swagger
   * /chat/ai/test:
   *   post:
   *     summary: Probar el servicio de IA
   *     description: Prueba el servicio de IA con un mensaje de prueba
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [mensaje]
   *             properties:
   *               mensaje:
   *                 type: string
   *                 description: Mensaje de prueba para enviar a la IA
   *                 example: "Hola, ¿cómo estás?"
   *     responses:
   *       200:
   *         description: Prueba de IA completada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     input:
   *                       type: string
   *                       description: Mensaje de entrada
   *                     response:
   *                       type: string
   *                       description: Respuesta de la IA
   *                     model:
   *                       type: string
   *                       example: "gemini-pro"
   *                     tokensUsed:
   *                       type: integer
   *                       description: Tokens utilizados
   *                 message:
   *                   type: string
   *                   example: "Prueba de IA completada exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: Mensaje de prueba requerido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error probando IA
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/ai/test', async (req, res) => {
    try {
      const { mensaje } = req.body;
      
      if (!mensaje) {
        return res.status(400).json({
          data: null,
          message: 'Mensaje de prueba requerido',
          status: 'error'
        });
      }

      const testResponse = await geminiService.generateResponse({
        userMessage: mensaje,
        userId: 'test-user'
      });

      res.json({
        data: {
          input: mensaje,
          response: testResponse.response,
          model: testResponse.model,
          tokensUsed: testResponse.tokensUsed
        },
        message: 'Prueba de IA completada exitosamente',
        status: 'success'
      });
    } catch (error) {
      console.error('Error testing AI:', error);
      res.status(500).json({
        data: null,
        message: 'Error probando IA',
        status: 'error'
      });
    }
  });

  return router;
} 