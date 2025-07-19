import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chat Service API',
      version: '1.0.0',
      description: 'API completa para el microservicio de chat con soporte para IA y conversaciones 1 a 1',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.example.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      schemas: {
        // Esquemas de respuesta comunes
        ApiResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Datos de la respuesta'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo'
            },
            status: {
              type: 'string',
              enum: ['success', 'error'],
              description: 'Estado de la respuesta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'null'
            },
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            status: {
              type: 'string',
              enum: ['error']
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código de error'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Detalles del error'
                }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Página actual'
            },
            limit: {
              type: 'integer',
              description: 'Elementos por página'
            },
            total: {
              type: 'integer',
              description: 'Total de elementos'
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas'
            },
            hasNext: {
              type: 'boolean',
              description: 'Si hay siguiente página'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Si hay página anterior'
            }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del mensaje'
            },
            mensaje: {
              type: 'string',
              description: 'Contenido del mensaje'
            },
            estado: {
              type: 'string',
              enum: ['enviado', 'entregado', 'leido', 'fallido'],
              description: 'Estado del mensaje'
            },
            fecha: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de envío'
            },
            usuario_id: {
              type: 'string',
              description: 'ID del usuario que envió el mensaje'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            },
            is_ai_response: {
              type: 'boolean',
              description: 'Si es respuesta de IA'
            },
            response_to_message_id: {
              type: 'string',
              description: 'ID del mensaje al que responde'
            },
            conversation_id: {
              type: 'string',
              description: 'ID de la conversación (para mensajes privados)'
            },
            recipient_id: {
              type: 'string',
              description: 'ID del destinatario (para mensajes privados)'
            }
          }
        },
        Conversation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la conversación'
            },
            participant1_id: {
              type: 'string',
              description: 'ID del primer participante'
            },
            participant2_id: {
              type: 'string',
              description: 'ID del segundo participante'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            },
            is_active: {
              type: 'boolean',
              description: 'Si la conversación está activa'
            },
            last_message_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha del último mensaje'
            }
          }
        },
        SendMessageRequest: {
          type: 'object',
          required: ['mensaje', 'usuario_id'],
          properties: {
            mensaje: {
              type: 'string',
              minLength: 1,
              maxLength: 5000,
              description: 'Contenido del mensaje'
            },
            usuario_id: {
              type: 'string',
              description: 'ID del usuario que envía el mensaje'
            },
            chat_estudiante_id: {
              type: 'string',
              description: 'ID del estudiante (opcional)'
            },
            recipient_id: {
              type: 'string',
              description: 'ID del destinatario (para mensajes privados)'
            },
            conversation_id: {
              type: 'string',
              description: 'ID de la conversación (para continuar conversación existente)'
            }
          }
        },
        SendMessageResponse: {
          type: 'object',
          properties: {
            message: {
              $ref: '#/components/schemas/ChatMessage'
            },
            ai_response: {
              $ref: '#/components/schemas/ChatMessage'
            }
          }
        },
        ConversationResponse: {
          type: 'object',
          properties: {
            conversations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Conversation'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationMeta'
            }
          }
        },
        ConversationMessagesResponse: {
          type: 'object',
          properties: {
            conversation: {
              $ref: '#/components/schemas/Conversation'
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ChatMessage'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationMeta'
            }
          }
        }
      },
      securitySchemes: {
        UserIdAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-User-ID',
          description: 'ID del usuario (autenticación simplificada sin JWT)'
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de estado y monitoreo'
      },
      {
        name: 'Chat',
        description: 'Endpoints para chat con IA'
      },
      {
        name: 'Conversations',
        description: 'Endpoints para conversaciones 1 a 1'
      },
      {
        name: 'WebSocket',
        description: 'Información sobre WebSocket'
      }
    ]
  },
  apis: [
    './src/infrastructure/routes/*.ts',
    './src/infrastructure/controllers/*.ts',
    './src/infrastructure/server/ChatServer.ts'
  ]
};

export const specs = swaggerJsdoc(options); 