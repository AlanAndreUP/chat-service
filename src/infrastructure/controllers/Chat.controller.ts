import { Request, Response } from 'express';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistory.usecase';
import { ApiResponse, SendMessageRequest, GetChatHistoryRequest, ErrorResponse } from '@shared/types/response.types';
import Joi from 'joi';

export class ChatController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getChatHistoryUseCase: GetChatHistoryUseCase
  ) {}

  private validateSendMessageRequest = Joi.object({
    mensaje: Joi.string().min(1).max(5000).required().messages({
      'string.min': 'El mensaje no puede estar vacío',
      'string.max': 'El mensaje no puede tener más de 5000 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
    usuario_id: Joi.string().required().messages({
      'any.required': 'El ID del usuario es requerido'
    }),
    chat_estudiante_id: Joi.string().optional()
  });

  private validateHistoryRequest = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    fecha_desde: Joi.string().isoDate().optional(),
    fecha_hasta: Joi.string().isoDate().optional()
  });

  /**
   * @swagger
   * /chat/message:
   *   post:
   *     summary: Enviar mensaje de chat y obtener respuesta de IA
   *     description: Envía un mensaje de chat y recibe una respuesta automática generada por Gemini IA
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SendMessageRequest'
   *           examples:
   *             chat_with_ai:
   *               summary: Chat con IA
   *               value:
   *                 mensaje: "Hola, ¿cómo estás? Necesito ayuda con matemáticas"
   *                 usuario_id: "user123"
   *                 chat_estudiante_id: "estudiante456"
   *             private_message:
   *               summary: Mensaje privado
   *               value:
   *                 mensaje: "Hola, ¿cómo va todo?"
   *                 usuario_id: "user123"
   *                 recipient_id: "user456"
   *     responses:
   *       201:
   *         description: Mensaje enviado exitosamente con respuesta de IA
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/SendMessageResponse'
   *                 message:
   *                   type: string
   *                   example: "Mensaje enviado exitosamente y respuesta de IA generada"
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
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('💬 POST /chat/message - Enviando mensaje');

      // Validar datos de entrada
      const { error, value } = this.validateSendMessageRequest.validate(req.body);
      
      if (error) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'Datos de entrada inválidos',
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            details: error.details.map((detail: any) => detail.message)
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      const request: SendMessageRequest = value;

      // Ejecutar caso de uso
      const result = await this.sendMessageUseCase.execute(request);

      const response: ApiResponse = {
        data: result,
        message: 'Mensaje enviado exitosamente y respuesta de IA generada',
        status: 'success'
      };

      res.status(201).json(response);
      console.log('✅ Mensaje enviado y respuesta generada');

    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'SEND_MESSAGE_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /chat/history/{estudiante_id}:
   *   get:
   *     summary: Obtener historial de chat de un estudiante
   *     description: Obtiene el historial completo de chat de un estudiante incluyendo mensajes e intentos
   *     tags: [Chat]
   *     parameters:
   *       - in: path
   *         name: estudiante_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del estudiante
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
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Elementos por página
   *       - in: query
   *         name: fecha_desde
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de inicio (ISO string)
   *       - in: query
   *         name: fecha_hasta
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin (ISO string)
   *     responses:
   *       200:
   *         description: Historial de chat obtenido exitosamente
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
   *                     attempts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           open_without_send:
   *                             type: integer
   *                           chat_estudiante_id:
   *                             type: string
   *                           created_at:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *                 message:
   *                   type: string
   *                   example: "Historial de chat obtenido exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: ID del estudiante requerido o parámetros inválidos
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
  getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`📜 GET /chat/history/${req.params.estudiante_id} - Obteniendo historial`);

      const { estudiante_id } = req.params;

      if (!estudiante_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del estudiante es requerido',
          status: 'error',
          error: {
            code: 'MISSING_STUDENT_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validar query parameters
      const { error, value } = this.validateHistoryRequest.validate(req.query);
      
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

      const historyRequest: GetChatHistoryRequest = {
        estudiante_id,
        ...value
      };

      // Ejecutar caso de uso
      const result = await this.getChatHistoryUseCase.execute(historyRequest);

      const response: ApiResponse = {
        data: result,
        message: 'Historial de chat obtenido exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Historial obtenido: ${result.messages.length} mensajes`);

    } catch (error) {
      console.error('❌ Error en getChatHistory:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_HISTORY_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * GET /chat/history/:estudiante_id/messages
   * Obtener solo mensajes sin intentos (más rápido)
   */
  getMessagesOnly = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`💬 GET /chat/history/${req.params.estudiante_id}/messages - Solo mensajes`);

      const { estudiante_id } = req.params;

      if (!estudiante_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del estudiante es requerido',
          status: 'error',
          error: {
            code: 'MISSING_STUDENT_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      const { error, value } = this.validateHistoryRequest.validate(req.query);
      
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

      const historyRequest: GetChatHistoryRequest = {
        estudiante_id,
        ...value
      };

      const result = await this.getChatHistoryUseCase.getMessagesOnly(historyRequest);

      const response: ApiResponse = {
        data: result,
        message: 'Mensajes obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Solo mensajes obtenidos: ${result.messages.length}`);

    } catch (error) {
      console.error('❌ Error en getMessagesOnly:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_MESSAGES_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * POST /chat/attempt
   * Registrar intento de chat (cuando se abre el input sin enviar)
   */
  recordAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📝 POST /chat/attempt - Registrando intento');

      const { estudiante_id } = req.body;

      if (!estudiante_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del estudiante es requerido',
          status: 'error',
          error: {
            code: 'MISSING_STUDENT_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // TODO: Implementar lógica de registrar intento
      // Por ahora, solo retornamos éxito
      const response: ApiResponse = {
        data: {
          estudiante_id,
          attempt_recorded: true,
          timestamp: new Date().toISOString()
        },
        message: 'Intento de chat registrado exitosamente',
        status: 'success'
      };

      res.status(201).json(response);
      console.log(`✅ Intento registrado para estudiante: ${estudiante_id}`);

    } catch (error) {
      console.error('❌ Error en recordAttempt:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'RECORD_ATTEMPT_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * GET /chat/attempts/:estudiante_id
   * Obtener intentos de chat de un estudiante
   */
  getAttempts = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`📊 GET /chat/attempts/${req.params.estudiante_id} - Obteniendo intentos`);

      const { estudiante_id } = req.params;

      if (!estudiante_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del estudiante es requerido',
          status: 'error',
          error: {
            code: 'MISSING_STUDENT_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // TODO: Implementar lógica real de obtener intentos
      const response: ApiResponse = {
        data: {
          estudiante_id,
          attempts: [],
          total: 0
        },
        message: 'Intentos obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Intentos obtenidos para estudiante: ${estudiante_id}`);

    } catch (error) {
      console.error('❌ Error en getAttempts:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_ATTEMPTS_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };
} 