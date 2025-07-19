import { Request, Response } from 'express';
import { SendPrivateMessageUseCase } from '@application/use-cases/SendPrivateMessage.usecase';
import { GetConversationsUseCase } from '@application/use-cases/GetConversations.usecase';
import { GetConversationMessagesUseCase } from '@application/use-cases/GetConversationMessages.usecase';
import { ApiResponse, SendMessageRequest, ErrorResponse } from '@shared/types/response.types';
import Joi from 'joi';

export class ConversationController {
  constructor(
    private readonly sendPrivateMessageUseCase: SendPrivateMessageUseCase,
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase
  ) {}

  private validateSendPrivateMessageRequest = Joi.object({
    mensaje: Joi.string().min(1).max(5000).required().messages({
      'string.min': 'El mensaje no puede estar vacío',
      'string.max': 'El mensaje no puede tener más de 5000 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
    usuario_id: Joi.string().required().messages({
      'any.required': 'El ID del usuario es requerido'
    }),
    recipient_id: Joi.string().required().messages({
      'any.required': 'El ID del destinatario es requerido'
    }),
    conversation_id: Joi.string().optional()
  });

  private validateGetConversationsRequest = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(50).optional().default(20)
  });

  private validateGetConversationMessagesRequest = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(50)
  });

  /**
   * @swagger
   * /conversations/message:
   *   post:
   *     summary: Enviar mensaje privado a otro usuario
   *     description: Envía un mensaje privado a otro usuario, creando o continuando una conversación 1 a 1
   *     tags: [Conversations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [mensaje, usuario_id, recipient_id]
   *             properties:
   *               mensaje:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 5000
   *                 description: Contenido del mensaje
   *               usuario_id:
   *                 type: string
   *                 description: ID del usuario que envía el mensaje
   *               recipient_id:
   *                 type: string
   *                 description: ID del usuario destinatario
   *               conversation_id:
   *                 type: string
   *                 description: ID de la conversación (opcional, para continuar conversación existente)
   *           examples:
   *             new_conversation:
   *               summary: Nueva conversación
   *               value:
   *                 mensaje: "Hola, ¿cómo va todo?"
   *                 usuario_id: "user123"
   *                 recipient_id: "user456"
   *             existing_conversation:
   *               summary: Conversación existente
   *               value:
   *                 mensaje: "¿Cómo te fue en el examen?"
   *                 usuario_id: "user123"
   *                 recipient_id: "user456"
   *                 conversation_id: "conv123"
   *     responses:
   *       201:
   *         description: Mensaje privado enviado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       $ref: '#/components/schemas/ChatMessage'
   *                 message:
   *                   type: string
   *                   example: "Mensaje privado enviado exitosamente"
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
  sendPrivateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('💬 POST /conversations/message - Enviando mensaje privado');

      // Validar datos de entrada
      const { error, value } = this.validateSendPrivateMessageRequest.validate(req.body);
      
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
      const result = await this.sendPrivateMessageUseCase.execute(request);

      const response: ApiResponse = {
        data: result,
        message: 'Mensaje privado enviado exitosamente',
        status: 'success'
      };

      res.status(201).json(response);
      console.log('✅ Mensaje privado enviado');

    } catch (error) {
      console.error('❌ Error en sendPrivateMessage:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'SEND_PRIVATE_MESSAGE_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /conversations/{usuario_id}:
   *   get:
   *     summary: Obtener conversaciones de un usuario
   *     description: Obtiene todas las conversaciones 1 a 1 de un usuario, ordenadas por último mensaje
   *     tags: [Conversations]
   *     parameters:
   *       - in: path
   *         name: usuario_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
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
   *           maximum: 50
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
   *                   $ref: '#/components/schemas/ConversationResponse'
   *                 message:
   *                   type: string
   *                   example: "Conversaciones obtenidas exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: ID del usuario requerido o parámetros inválidos
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
  getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`📋 GET /conversations/${req.params.usuario_id} - Obteniendo conversaciones`);

      const { usuario_id } = req.params;

      if (!usuario_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del usuario es requerido',
          status: 'error',
          error: {
            code: 'MISSING_USER_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validar query parameters
      const { error, value } = this.validateGetConversationsRequest.validate(req.query);
      
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

      const request = {
        usuario_id,
        ...value
      };

      // Ejecutar caso de uso
      const result = await this.getConversationsUseCase.execute(request);

      const response: ApiResponse = {
        data: result,
        message: 'Conversaciones obtenidas exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Conversaciones obtenidas: ${result.conversations.length}`);

    } catch (error) {
      console.error('❌ Error en getConversations:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_CONVERSATIONS_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * @swagger
   * /conversations/{conversation_id}/messages:
   *   get:
   *     summary: Obtener mensajes de una conversación específica
   *     description: Obtiene todos los mensajes de una conversación 1 a 1, marcando automáticamente como leídos
   *     tags: [Conversations]
   *     parameters:
   *       - in: path
   *         name: conversation_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la conversación
   *       - in: query
   *         name: usuario_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario que solicita los mensajes (para verificar acceso)
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
   *         description: Mensajes de conversación obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/ConversationMessagesResponse'
   *                 message:
   *                   type: string
   *                   example: "Mensajes de conversación obtenidos exitosamente"
   *                 status:
   *                   type: string
   *                   example: "success"
   *       400:
   *         description: ID de conversación o usuario requerido, o parámetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: No tienes acceso a esta conversación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Conversación no encontrada
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
  getConversationMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`💬 GET /conversations/${req.params.conversation_id}/messages - Obteniendo mensajes`);

      const { conversation_id } = req.params;
      const { usuario_id } = req.query;

      if (!conversation_id) {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID de la conversación es requerido',
          status: 'error',
          error: {
            code: 'MISSING_CONVERSATION_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!usuario_id || typeof usuario_id !== 'string') {
        const errorResponse: ErrorResponse = {
          data: null,
          message: 'ID del usuario es requerido',
          status: 'error',
          error: {
            code: 'MISSING_USER_ID'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validar query parameters
      const { error, value } = this.validateGetConversationMessagesRequest.validate(req.query);
      
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

      const request = {
        conversation_id,
        usuario_id,
        ...value
      };

      // Ejecutar caso de uso
      const result = await this.getConversationMessagesUseCase.execute(request);

      const response: ApiResponse = {
        data: result,
        message: 'Mensajes de conversación obtenidos exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
      console.log(`✅ Mensajes obtenidos: ${result.messages.length}`);

    } catch (error) {
      console.error('❌ Error en getConversationMessages:', error);
      
      const errorResponse: ErrorResponse = {
        data: null,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'GET_CONVERSATION_MESSAGES_ERROR'
        }
      };

      res.status(500).json(errorResponse);
    }
  };
} 