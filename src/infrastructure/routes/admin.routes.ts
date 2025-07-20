import { Router } from 'express';
import { AdminController } from '@infrastructure/controllers/Admin.controller';
import { GetAllConversationsUseCase } from '@application/use-cases/GetAllConversations.usecase';
import { GetAllMessagesUseCase } from '@application/use-cases/GetAllMessages.usecase';
import { GetAllAttemptsUseCase } from '@application/use-cases/GetAllAttempts.usecase';
import { MongoConversationRepository } from '@infrastructure/repositories/MongoConversationRepository';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { MongoChatAttemptsRepository } from '@infrastructure/repositories/MongoChatAttemptsRepository';

export function createAdminRoutes(): Router {
  const router = Router();
  
  // Dependencias
  const conversationRepository = new MongoConversationRepository();
  const chatRepository = new MongoChatRepository();
  const attemptsRepository = new MongoChatAttemptsRepository();
  
  // Casos de uso
  const getAllConversationsUseCase = new GetAllConversationsUseCase(conversationRepository);
  const getAllMessagesUseCase = new GetAllMessagesUseCase(chatRepository);
  const getAllAttemptsUseCase = new GetAllAttemptsUseCase(attemptsRepository);
  
  // Controlador
  const adminController = new AdminController(
    getAllConversationsUseCase,
    getAllMessagesUseCase,
    getAllAttemptsUseCase
  );

  // ============================================================================
  // RUTAS ADMINISTRATIVAS - TODOS LOS USUARIOS
  // ============================================================================

  /**
   * GET /admin/conversations
   * Obtener todas las conversaciones de todos los usuarios
   */
  router.get('/conversations', adminController.getAllConversations);

  /**
   * GET /admin/messages
   * Obtener todos los mensajes de chat de todos los usuarios
   */
  router.get('/messages', adminController.getAllMessages);

  /**
   * GET /admin/attempts
   * Obtener todos los intentos de chat de todos los usuarios
   */
  router.get('/attempts', adminController.getAllAttempts);

  // ============================================================================
  // RUTAS DE ESTADO Y HEALTH CHECK ADMINISTRATIVO
  // ============================================================================

  /**
   * @swagger
   * /admin/status:
   *   get:
   *     summary: Estado del servicio administrativo
   *     description: Verifica el estado del servicio administrativo y muestra estadísticas generales
   *     tags: [Admin]
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
   *                       example: "admin-service"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     features:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["Obtener todas las conversaciones", "Obtener todos los mensajes", "Obtener todos los intentos", "Paginación avanzada", "Estadísticas generales"]
   *                     limits:
   *                       type: object
   *                       properties:
   *                         maxItemsPerPage:
   *                           type: integer
   *                           example: 100
   *                         maxPages:
   *                           type: integer
   *                           example: 1000
   *                 message:
   *                   type: string
   *                   example: "Servicio administrativo funcionando correctamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       500:
   *         description: Error verificando estado del servicio administrativo
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/status', async (req, res) => {
    try {
      res.json({
        data: {
          service: 'admin-service',
          timestamp: new Date().toISOString(),
          features: [
            'Obtener todas las conversaciones',
            'Obtener todos los mensajes',
            'Obtener todos los intentos',
            'Paginación avanzada',
            'Estadísticas generales'
          ],
          limits: {
            maxItemsPerPage: 100,
            maxPages: 1000
          }
        },
        message: 'Servicio administrativo funcionando correctamente',
        status: 'success'
      });
    } catch (error) {
      console.error('Error in admin status check:', error);
      res.status(500).json({
        data: null,
        message: 'Error verificando estado del servicio administrativo',
        status: 'error'
      });
    }
  });

  return router;
} 