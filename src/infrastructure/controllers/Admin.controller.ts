import { Request, Response } from 'express';
import { GetAllConversationsUseCase } from '@application/use-cases/GetAllConversations.usecase';
import { GetAllMessagesUseCase } from '@application/use-cases/GetAllMessages.usecase';
import { GetAllAttemptsUseCase } from '@application/use-cases/GetAllAttemptsByUser.usecase';
import { EmailService } from '@application/services/EmailService';
import { ApiResponse, ErrorResponse } from '@shared/types/response.types';
import Joi from 'joi';

export class AdminController {
  private validateGetAllRequest = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'fecha').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  constructor(
    private readonly getAllConversationsUseCase: GetAllConversationsUseCase,
    private readonly getAllMessagesUseCase: GetAllMessagesUseCase,
    private readonly getAllAttemptsUseCase: GetAllAttemptsUseCase,
    private readonly emailService: EmailService
  ) {}

  /**
   * @swagger
   * /s3/admin/conversations:
   *   get:
   *     summary: Obtener todas las conversaciones de todos los usuarios
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Número de elementos por página
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, fecha]
   *           default: created_at
   *         description: Campo por el cual ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Orden de clasificación
   *     responses:
   *       200:
   *         description: Lista de conversaciones obtenida exitosamente
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
   *                         $ref: '#/components/schemas/Conversation'
   *                     pagination:
   *                       $ref: '#/components/schemas/Pagination'
   *                 message:
   *                   type: string
   *                 status:
   *                   type: string
   *       400:
   *         description: Parámetros de consulta inválidos
   *       500:
   *         description: Error interno del servidor
   */
  getAllConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 GET /s3/admin/conversations - Obteniendo todas las conversaciones');

      const { error, value } = this.validateGetAllRequest.validate(req.query);

      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map(detail => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.getAllConversationsUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todas las conversaciones obtenidas exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Conversaciones obtenidas: ${result.conversations.length}`);

    } catch (error) {
      console.error('❌ Error obteniendo todas las conversaciones:', error);
      const errorResponse: ErrorResponse = {
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_CONVERSATIONS_ERROR',
          details: error instanceof Error ? [error.message] : ['Error desconocido']
        }
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /s3/admin/messages:
   *   get:
   *     summary: Obtener todos los mensajes de chat de todos los usuarios
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Número de elementos por página
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, fecha]
   *           default: created_at
   *         description: Campo por el cual ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Orden de clasificación
   *     responses:
   *       200:
   *         description: Lista de mensajes obtenida exitosamente
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
   *                         $ref: '#/components/schemas/ChatHistory'
   *                     pagination:
   *                       $ref: '#/components/schemas/Pagination'
   *                 message:
   *                   type: string
   *                 status:
   *                   type: string
   *       400:
   *         description: Parámetros de consulta inválidos
   *       500:
   *         description: Error interno del servidor
   */
  getAllMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 GET /s3/admin/messages - Obteniendo todos los mensajes');

      const { error, value } = this.validateGetAllRequest.validate(req.query);

      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map(detail => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.getAllMessagesUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todos los mensajes obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Mensajes obtenidos: ${result.messages.length}`);

    } catch (error) {
      console.error('❌ Error obteniendo todos los mensajes:', error);
      const errorResponse: ErrorResponse = {
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_MESSAGES_ERROR',
          details: error instanceof Error ? [error.message] : ['Error desconocido']
        }
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /s3/admin/attempts:
   *   get:
   *     summary: Obtener todos los intentos de chat de todos los usuarios
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Número de elementos por página
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, fecha]
   *           default: created_at
   *         description: Campo por el cual ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Orden de clasificación
   *     responses:
   *       200:
   *         description: Lista de intentos obtenida exitosamente
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
   *                         $ref: '#/components/schemas/ChatAttempts'
   *                     pagination:
   *                       $ref: '#/components/schemas/Pagination'
   *                 message:
   *                   type: string
   *                 status:
   *                   type: string
   *       400:
   *         description: Parámetros de consulta inválidos
   *       500:
   *         description: Error interno del servidor
   */
  getAllAttempts = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 GET /s3/admin/attempts - Obteniendo todos los intentos');

      const { error, value } = this.validateGetAllRequest.validate(req.query);

      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Parámetros de consulta inválidos',
          status: 'error',
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            details: error.details.map(detail => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.getAllAttemptsUseCase.execute(value);

      const response: ApiResponse = {
        data: result,
        message: 'Todos los intentos obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Intentos obtenidos: ${result.attempts.length}`);

    } catch (error) {
      console.error('❌ Error obteniendo todos los intentos:', error);
      const errorResponse: ErrorResponse = {
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ALL_ATTEMPTS_ERROR',
          details: error instanceof Error ? [error.message] : ['Error desconocido']
        }
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /s3/admin/status:
   *   get:
   *     summary: Obtener estado general del sistema
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Estado del sistema obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                     timestamp:
   *                       type: string
   *                     version:
   *                       type: string
   *                 message:
   *                   type: string
   *                 status:
   *                   type: string
   *       500:
   *         description: Error interno del servidor
   */
  getSystemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 GET /s3/admin/status - Obteniendo estado del sistema');

      const status = {
        status: 'operational',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      const response: ApiResponse = {
        data: status,
        message: 'Estado del sistema obtenido exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log('✅ Estado del sistema obtenido');

    } catch (error) {
      console.error('❌ Error obteniendo estado del sistema:', error);
      const errorResponse: ErrorResponse = {
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_SYSTEM_STATUS_ERROR',
          details: error instanceof Error ? [error.message] : ['Error desconocido']
        }
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /s3/admin/tutors:
   *   get:
   *     summary: Obtener información de tutores desde la API de autenticación
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Información de tutores obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       nombre:
   *                         type: string
   *                       correo:
   *                         type: string
   *                 message:
   *                   type: string
   *                 status:
   *                   type: string
   *       500:
   *         description: Error interno del servidor
   */
  getTutorsInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 GET /s3/admin/tutors - Obteniendo información de tutores');

      const tutors = await this.emailService.getTutorsInfo();

      const response: ApiResponse = {
        data: tutors,
        message: 'Información de tutores obtenida exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Información de tutores obtenida: ${tutors.length} tutores`);

    } catch (error) {
      console.error('❌ Error obteniendo información de tutores:', error);
      const errorResponse: ErrorResponse = {
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_TUTORS_INFO_ERROR',
          details: error instanceof Error ? [error.message] : ['Error desconocido']
        }
      };
      res.status(500).json(errorResponse);
    }
  };
} 