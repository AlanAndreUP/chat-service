import { Request, Response } from 'express';
import { GetAllConversationsUseCase } from '@application/use-cases/GetAllConversations.usecase';
import { GetAllMessagesUseCase } from '@application/use-cases/GetAllMessages.usecase';
import { GetAllAttemptsUseCase } from '@application/use-cases/GetAllAttempts.usecase';
import { ApiResponse, ErrorResponse } from '@shared/types/response.types';
import Joi from 'joi';

export class AdminController {
  constructor(
    private readonly getAllConversationsUseCase: GetAllConversationsUseCase,
    private readonly getAllMessagesUseCase: GetAllMessagesUseCase,
    private readonly getAllAttemptsUseCase: GetAllAttemptsUseCase
  ) {}

  private validatePaginationRequest = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(50)
  });

  /**
   * @swagger
   * /admin/conversations:
   *   get:
   *     summary: Obtener todas las conversaciones de todos los usuarios
   *     description: Obtiene todas las conversaciones 1 a 1 de todos los usuarios con paginación
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           minimum: 1
   *           maximum: 100
   *         description: Elementos por página
   *     responses:
   *       200:
   *         description: Conversaciones obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     conversations:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           participant1_id:
   *                             type: string
   *                           participant2_id:
   *                             type: string
   *                           created_at:
   *                             type: string
   *                             format: date-time
   *                           updated_at:
   *                             type: string
   *                             format: date-time
   *                           is_active:
   *                             type: boolean
   *                           last_message_at:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *                 message:
   *                   type: string
   *                   example: "Todas las conversaciones obtenidas exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: Parámetros de consulta inválidos
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
  getAllConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📋 GET /admin/conversations - Obteniendo todas las conversaciones');

      // Validar query parameters
      const { error, value } = this.validatePaginationRequest.validate(req.query);
      
      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map((detail: any) => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Ejecutar caso de uso
      const result = await this.getAllConversationsUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todas las conversaciones obtenidas exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Conversaciones obtenidas: ${result.conversations.length}`);

    } catch (error) {
      console.error('❌ Error en getAllConversations:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_CONVERSATIONS_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /admin/messages:
   *   get:
   *     summary: Obtener todos los mensajes de chat de todos los usuarios
   *     description: Obtiene todos los mensajes de chat de todos los usuarios con paginación
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           minimum: 1
   *           maximum: 100
   *         description: Elementos por página
   *     responses:
   *       200:
   *         description: Mensajes obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     messages:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ChatMessage'
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *                 message:
   *                   type: string
   *                   example: "Todos los mensajes obtenidos exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: Parámetros de consulta inválidos
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
  getAllMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('💬 GET /admin/messages - Obteniendo todos los mensajes');

      // Validar query parameters
      const { error, value } = this.validatePaginationRequest.validate(req.query);
      
      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map((detail: any) => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Ejecutar caso de uso
      const result = await this.getAllMessagesUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todos los mensajes obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Mensajes obtenidos: ${result.messages.length}`);

    } catch (error) {
      console.error('❌ Error en getAllMessages:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_MESSAGES_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /admin/attempts:
   *   get:
   *     summary: Obtener todos los intentos de chat de todos los usuarios
   *     description: Obtiene todos los intentos de chat de todos los usuarios con paginación
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           minimum: 1
   *           maximum: 100
   *         description: Elementos por página
   *     responses:
   *       200:
   *         description: Intentos obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     attempts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           open_without_send:
   *                             type: number
   *                           chat_estudiante_id:
   *                             type: string
   *                           created_at:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *                 message:
   *                   type: string
   *                   example: "Todos los intentos obtenidos exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: Parámetros de consulta inválidos
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
  getAllAttempts = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📊 GET /admin/attempts - Obteniendo todos los intentos');

      // Validar query parameters
      const { error, value } = this.validatePaginationRequest.validate(req.query);
      
      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map((detail: any) => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Ejecutar caso de uso
      const result = await this.getAllAttemptsUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todos los intentos obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Intentos obtenidos: ${result.attempts.length}`);

    } catch (error) {
      console.error('❌ Error en getAllAttempts:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_ATTEMPTS_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };
} 