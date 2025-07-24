import { Router } from 'express';
import { ChatController } from '@infrastructure/controllers/Chat.controller';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistory.usecase';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { MongoChatAttemptsRepository } from '@infrastructure/repositories/MongoChatAttemptsRepository';
import { GeminiAIService } from '@application/services/GeminiAI.service';
import { EmailService } from '@application/services/EmailService';
import { MongoAIAnalysisRepository } from '@infrastructure/repositories/MongoAIAnalysisRepository';
import { MongoAIConversationRepository } from '@infrastructure/repositories/MongoAIConversationRepository';
import { AttemptMessageUseCase } from '@application/use-cases/AttemptMessage.usecase';
import { GetAllAttemptsUseCase } from '@application/use-cases/GetAllAttemptsByUser.usecase';

export function createChatRoutes(): Router {
  const router = Router();
  
  // Dependencias
  const chatRepository = new MongoChatRepository();
  const attemptsRepository = new MongoChatAttemptsRepository();
  const geminiService = new GeminiAIService();
  const emailService = new EmailService();
  const aiAnalysisRepository = new MongoAIAnalysisRepository();
  const aiConversationRepository = new MongoAIConversationRepository();
  
  // Casos de uso
  const sendMessageUseCase = new SendMessageUseCase(chatRepository, geminiService, emailService, aiAnalysisRepository, aiConversationRepository);
  const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository, attemptsRepository);
  const attemptMessageUseCase = new AttemptMessageUseCase(attemptsRepository);
  const getAllAttemptsUseCase = new GetAllAttemptsUseCase(attemptsRepository);
  
  // Controlador
  const chatController = new ChatController(sendMessageUseCase, getChatHistoryUseCase, attemptMessageUseCase, getAllAttemptsUseCase);

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
   * Registrar intento de chat (contador diario)
   * @swagger
   * /s3/chat/attempt:
   *   post:
   *     summary: Registrar intento de chat (contador diario)
   *     description: Incrementa el contador de intentos de chat de un usuario (y conversación, si aplica) para el día actual.
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - usuario_id
   *             properties:
   *               usuario_id:
   *                 type: string
   *                 description: ID del usuario que realiza el intento
   *                 example: "user123"
   *               conversation_id:
   *                 type: string
   *                 description: ID de la conversación (opcional)
   *                 example: "conv456"
   *     responses:
   *       201:
   *         description: Intento registrado exitosamente (contador incrementado)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "user123_conv456_2024-06-10"
   *                     usuario_id:
   *                       type: string
   *                       example: "user123"
   *                     conversation_id:
   *                       type: string
   *                       example: "conv456"
   *                     fecha:
   *                       type: string
   *                       format: date
   *                       example: "2024-06-10"
   *                     cantidad:
   *                       type: integer
   *                       example: 3
   *                 message:
   *                   type: string
   *                   example: "Intento de chat registrado exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: Datos de entrada inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/attempt', chatController.recordAttempt);

  /**
   * GET /chat/attempts/:estudiante_id
   * Obtener intentos de chat de un estudiante
   */
  /**
 * @swagger
 * /s3/chat/attempts/{usuario_id}:
 *   get:
 *     summary: Obtener contadores diarios de intentos de chat de un usuario
 *     description: Devuelve la lista de contadores de intentos de chat por día para el usuario especificado, con soporte de paginación y filtros.
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "user123"
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: conversation_id
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtrar por ID de conversación
 *       - in: query
 *         name: fecha_desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar desde esta fecha (YYYY-MM-DD)
 *       - in: query
 *         name: fecha_hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar hasta esta fecha (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Contadores de intentos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuario_id:
 *                       type: string
 *                       example: "user123"
 *                     attempts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user123_conv456_2024-06-10"
 *                           usuario_id:
 *                             type: string
 *                             example: "user123"
 *                           conversation_id:
 *                             type: string
 *                             example: "conv456"
 *                           fecha:
 *                             type: string
 *                             format: date
 *                             example: "2024-06-10"
 *                           cantidad:
 *                             type: integer
 *                             example: 3
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                     total:
 *                       type: integer
 *                       example: 100
 *                 message:
 *                   type: string
 *                   example: "Intentos obtenidos exitosamente"
 *                 status:
 *                   type: string
 *                   example: "success"
 *       400:
 *         description: ID del usuario es requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
  router.get('/attempts/:usuario_id', chatController.getAttempts);

  // ============================================================================
  // RUTAS DE ESTADO Y HEALTH CHECK
  // ============================================================================

  /**
   * @swagger
   * /s3/chat/status:
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
            status: 'connected'
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
   * /s3/chat/ai/info:
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
   * /s3/chat/ai/test:
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

  // Eliminar endpoint /attempt/usecase (ya no es necesario)

  return router;
} 