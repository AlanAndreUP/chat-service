#!/usr/bin/env node

/**
 * Script para generar la documentación de Swagger
 * Uso: node scripts/generate-swagger.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de Swagger
const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Chat Service API",
    version: "1.0.0",
    description: "API completa para el microservicio de chat con soporte para IA y conversaciones 1 a 1. Autenticación simplificada basada en userId sin JWT.",
    contact: {
      name: "Equipo de Desarrollo",
      email: "dev@example.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:3003",
      description: "Servidor de desarrollo"
    },
    {
      url: "https://api.example.com",
      description: "Servidor de producción"
    }
  ],
  components: {
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "Datos de la respuesta"
          },
          message: {
            type: "string",
            description: "Mensaje descriptivo"
          },
          status: {
            type: "string",
            enum: ["success", "error"],
            description: "Estado de la respuesta"
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          data: {
            type: "null"
          },
          message: {
            type: "string",
            description: "Mensaje de error"
          },
          status: {
            type: "string",
            enum: ["error"]
          },
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Código de error"
              },
              details: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Detalles del error"
              }
            }
          }
        }
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            description: "Página actual"
          },
          limit: {
            type: "integer",
            description: "Elementos por página"
          },
          total: {
            type: "integer",
            description: "Total de elementos"
          },
          totalPages: {
            type: "integer",
            description: "Total de páginas"
          },
          hasNext: {
            type: "boolean",
            description: "Si hay siguiente página"
          },
          hasPrev: {
            type: "boolean",
            description: "Si hay página anterior"
          }
        }
      },
      ChatMessage: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID único del mensaje"
          },
          mensaje: {
            type: "string",
            description: "Contenido del mensaje"
          },
          estado: {
            type: "string",
            enum: ["enviado", "entregado", "leido", "fallido"],
            description: "Estado del mensaje"
          },
          fecha: {
            type: "string",
            format: "date-time",
            description: "Fecha de envío"
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que envió el mensaje"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Fecha de creación"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Fecha de última actualización"
          },
          is_ai_response: {
            type: "boolean",
            description: "Si es respuesta de IA"
          },
          response_to_message_id: {
            type: "string",
            description: "ID del mensaje al que responde"
          },
          conversation_id: {
            type: "string",
            description: "ID de la conversación (para mensajes privados)"
          },
          recipient_id: {
            type: "string",
            description: "ID del destinatario (para mensajes privados)"
          }
        }
      },
      Conversation: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID único de la conversación"
          },
          participant1_id: {
            type: "string",
            description: "ID del primer participante"
          },
          participant2_id: {
            type: "string",
            description: "ID del segundo participante"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Fecha de creación"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Fecha de última actualización"
          },
          is_active: {
            type: "boolean",
            description: "Si la conversación está activa"
          },
          last_message_at: {
            type: "string",
            format: "date-time",
            description: "Fecha del último mensaje"
          }
        }
      },
      SendMessageRequest: {
        type: "object",
        required: ["mensaje", "usuario_id"],
        properties: {
          mensaje: {
            type: "string",
            minLength: 1,
            maxLength: 5000,
            description: "Contenido del mensaje"
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que envía el mensaje"
          },
          chat_estudiante_id: {
            type: "string",
            description: "ID del estudiante (opcional)"
          },
          recipient_id: {
            type: "string",
            description: "ID del destinatario (para mensajes privados)"
          },
          conversation_id: {
            type: "string",
            description: "ID de la conversación (para continuar conversación existente)"
          }
        }
      },
      SendMessageResponse: {
        type: "object",
        properties: {
          message: {
            $ref: "#/components/schemas/ChatMessage"
          },
          ai_response: {
            $ref: "#/components/schemas/ChatMessage"
          }
        }
      },
      ConversationResponse: {
        type: "object",
        properties: {
          conversations: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Conversation"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      ConversationMessagesResponse: {
        type: "object",
        properties: {
          conversation: {
            $ref: "#/components/schemas/Conversation"
          },
          messages: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ChatMessage"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      ChatAttempt: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID único del intento"
          },
          estudiante_id: {
            type: "string",
            description: "ID del estudiante"
          },
          fecha_inicio: {
            type: "string",
            format: "date-time",
            description: "Fecha de inicio del intento"
          },
          fecha_fin: {
            type: "string",
            format: "date-time",
            description: "Fecha de fin del intento"
          },
          duracion_minutos: {
            type: "number",
            description: "Duración en minutos"
          },
          mensajes_enviados: {
            type: "integer",
            description: "Número de mensajes enviados"
          },
          estado: {
            type: "string",
            enum: ["activo", "finalizado", "pausado"],
            description: "Estado del intento"
          }
        }
      },
      AIInfo: {
        type: "object",
        properties: {
          model: {
            type: "string",
            description: "Modelo de IA utilizado"
          },
          provider: {
            type: "string",
            description: "Proveedor de IA"
          },
          version: {
            type: "string",
            description: "Versión del modelo"
          },
          status: {
            type: "string",
            enum: ["available", "unavailable"],
            description: "Estado del servicio de IA"
          }
        }
      },
      WebSocketInfo: {
        type: "object",
        properties: {
          endpoint: {
            type: "string",
            description: "Endpoint de WebSocket"
          },
          transports: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Transportes soportados"
          },
          auth: {
            type: "object",
            properties: {
              required: {
                type: "boolean",
                description: "Si se requiere autenticación"
              },
              method: {
                type: "string",
                description: "Método de autenticación"
              }
            }
          },
          events: {
            type: "object",
            properties: {
              client_to_server: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Eventos de cliente a servidor"
              },
              server_to_client: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Eventos de servidor a cliente"
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      UserIdAuth: {
        type: "apiKey",
        in: "header",
        name: "X-User-ID",
        description: "ID del usuario (autenticación simplificada sin JWT)"
      }
    }
  },
  tags: [
    {
      name: "Health",
      description: "Endpoints de estado y monitoreo"
    },
    {
      name: "Chat",
      description: "Endpoints para chat con IA"
    },
    {
      name: "Conversations",
      description: "Endpoints para conversaciones 1 a 1"
    },
    {
      name: "WebSocket",
      description: "Información sobre WebSocket"
    }
  ],
  paths: {
    "/s3/health": {
      get: {
        summary: "Health check del servicio",
        description: "Verifica el estado general del servicio de chat",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Servicio funcionando correctamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        service: {
                          type: "string",
                          example: "chat-service"
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time"
                        },
                        version: {
                          type: "string",
                          example: "1.0.0"
                        },
                        uptime: {
                          type: "number",
                          description: "Tiempo de actividad en segundos"
                        },
                        websockets: {
                          type: "object",
                          properties: {
                            connected: {
                              type: "integer",
                              description: "Número de conexiones WebSocket activas"
                            },
                            status: {
                              type: "string",
                              example: "running"
                            }
                          }
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Servicio de chat funcionando correctamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/message": {
      post: {
        summary: "Enviar mensaje de chat",
        description: "Envía un mensaje de chat y obtiene respuesta automática de IA",
        tags: ["Chat"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SendMessageRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Mensaje enviado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/SendMessageResponse"
                    },
                    message: {
                      type: "string",
                      example: "Mensaje enviado exitosamente y respuesta de IA generada"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Datos de entrada inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Error interno del servidor",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/history/{estudiante_id}": {
      get: {
        summary: "Obtener historial de chat",
        description: "Obtiene el historial completo de chat de un estudiante",
        tags: ["Chat"],
        parameters: [
          {
            name: "estudiante_id",
            in: "path",
            required: true,
            description: "ID del estudiante",
            schema: {
              type: "string"
            }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Número de página",
            schema: {
              type: "integer",
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Elementos por página",
            schema: {
              type: "integer",
              default: 20
            }
          }
        ],
        responses: {
          "200": {
            description: "Historial obtenido exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        messages: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/ChatMessage"
                          }
                        },
                        attempts: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/ChatAttempt"
                          }
                        },
                        pagination: {
                          $ref: "#/components/schemas/PaginationMeta"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Historial de chat obtenido exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "Estudiante no encontrado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/history/{estudiante_id}/messages": {
      get: {
        summary: "Obtener solo mensajes",
        description: "Obtiene solo los mensajes del historial (sin intentos) - Más rápido",
        tags: ["Chat"],
        parameters: [
          {
            name: "estudiante_id",
            in: "path",
            required: true,
            description: "ID del estudiante",
            schema: {
              type: "string"
            }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Número de página",
            schema: {
              type: "integer",
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Elementos por página",
            schema: {
              type: "integer",
              default: 20
            }
          }
        ],
        responses: {
          "200": {
            description: "Mensajes obtenidos exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        messages: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/ChatMessage"
                          }
                        },
                        pagination: {
                          $ref: "#/components/schemas/PaginationMeta"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Mensajes obtenidos exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/attempt": {
      post: {
        summary: "Registrar intento de chat",
        description: "Registra un intento de chat cuando se abre el input sin enviar",
        tags: ["Chat"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estudiante_id"],
                properties: {
                  estudiante_id: {
                    type: "string",
                    description: "ID del estudiante"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Intento registrado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/ChatAttempt"
                    },
                    message: {
                      type: "string",
                      example: "Intento de chat registrado exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/attempts/{estudiante_id}": {
      get: {
        summary: "Obtener intentos de chat",
        description: "Obtiene los intentos de chat de un estudiante",
        tags: ["Chat"],
        parameters: [
          {
            name: "estudiante_id",
            in: "path",
            required: true,
            description: "ID del estudiante",
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Intentos obtenidos exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ChatAttempt"
                      }
                    },
                    message: {
                      type: "string",
                      example: "Intentos de chat obtenidos exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/status": {
      get: {
        summary: "Estado del servicio de chat",
        description: "Verifica el estado del servicio de chat y la integración con Gemini IA",
        tags: ["Chat"],
        responses: {
          "200": {
            description: "Estado del servicio obtenido exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        service: {
                          type: "string",
                          example: "chat-service"
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time"
                        },
                        ai: {
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              enum: ["healthy", "unhealthy"],
                              example: "healthy"
                            },
                            model: {
                              type: "string",
                              example: "gemini-pro"
                            },
                            provider: {
                              type: "string",
                              example: "Google"
                            },
                            version: {
                              type: "string",
                              example: "1.0.0"
                            }
                          }
                        },
                        database: {
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              example: "connected"
                            }
                          }
                        },
                        websockets: {
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              example: "running"
                            }
                          }
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Servicio de chat funcionando correctamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/ai/info": {
      get: {
        summary: "Información del modelo de IA",
        description: "Obtiene información detallada sobre el modelo de IA configurado",
        tags: ["Chat"],
        responses: {
          "200": {
            description: "Información de IA obtenida exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        ai: {
                          $ref: "#/components/schemas/AIInfo"
                        },
                        capabilities: {
                          type: "array",
                          items: {
                            type: "string"
                          },
                          example: ["Respuestas en tiempo real", "Contexto de conversación", "Especialización educativa", "Respuestas en español", "Manejo de errores gracioso"]
                        },
                        limits: {
                          type: "object",
                          properties: {
                            maxTokensPerResponse: {
                              type: "integer",
                              example: 1024
                            },
                            contextMessages: {
                              type: "integer",
                              example: 10
                            },
                            maxMessageLength: {
                              type: "integer",
                              example: 5000
                            }
                          }
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Información de IA obtenida exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/chat/ai/test": {
      post: {
        summary: "Probar el servicio de IA",
        description: "Prueba el servicio de IA con un mensaje de prueba",
        tags: ["Chat"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mensaje"],
                properties: {
                  mensaje: {
                    type: "string",
                    description: "Mensaje de prueba para enviar a la IA",
                    example: "Hola, ¿cómo estás?"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Prueba de IA completada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        input: {
                          type: "string",
                          description: "Mensaje de entrada"
                        },
                        response: {
                          type: "string",
                          description: "Respuesta de la IA"
                        },
                        model: {
                          type: "string",
                          example: "gemini-pro"
                        },
                        tokensUsed: {
                          type: "integer",
                          description: "Tokens utilizados"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Prueba de IA completada exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Mensaje de prueba requerido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Error probando IA",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/s3/conversations/message": {
      post: {
        summary: "Enviar mensaje privado",
        description: "Envía un mensaje privado a otro usuario",
        tags: ["Conversations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mensaje", "usuario_id", "recipient_id"],
                properties: {
                  mensaje: {
                    type: "string",
                    minLength: 1,
                    maxLength: 5000,
                    description: "Contenido del mensaje"
                  },
                  usuario_id: {
                    type: "string",
                    description: "ID del usuario que envía el mensaje"
                  },
                  recipient_id: {
                    type: "string",
                    description: "ID del destinatario"
                  },
                  conversation_id: {
                    type: "string",
                    description: "ID de la conversación (opcional, para continuar conversación existente)"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Mensaje privado enviado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        message: {
                          $ref: "#/components/schemas/ChatMessage"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Mensaje privado enviado exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Datos de entrada inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/s3/conversations/{usuario_id}": {
      get: {
        summary: "Obtener conversaciones de usuario",
        description: "Obtiene las conversaciones de un usuario",
        tags: ["Conversations"],
        parameters: [
          {
            name: "usuario_id",
            in: "path",
            required: true,
            description: "ID del usuario",
            schema: {
              type: "string"
            }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Número de página",
            schema: {
              type: "integer",
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Elementos por página",
            schema: {
              type: "integer",
              default: 20
            }
          }
        ],
        responses: {
          "200": {
            description: "Conversaciones obtenidas exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/ConversationResponse"
                    },
                    message: {
                      type: "string",
                      example: "Conversaciones obtenidas exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/conversations/{conversation_id}/messages": {
      get: {
        summary: "Obtener mensajes de conversación",
        description: "Obtiene los mensajes de una conversación específica",
        tags: ["Conversations"],
        parameters: [
          {
            name: "conversation_id",
            in: "path",
            required: true,
            description: "ID de la conversación",
            schema: {
              type: "string"
            }
          },
          {
            name: "usuario_id",
            in: "query",
            required: true,
            description: "ID del usuario que solicita los mensajes",
            schema: {
              type: "string"
            }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Número de página",
            schema: {
              type: "integer",
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Elementos por página",
            schema: {
              type: "integer",
              default: 50
            }
          }
        ],
        responses: {
          "200": {
            description: "Mensajes de conversación obtenidos exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/ConversationMessagesResponse"
                    },
                    message: {
                      type: "string",
                      example: "Mensajes de conversación obtenidos exitosamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/conversations/status": {
      get: {
        summary: "Estado del servicio de conversaciones",
        description: "Verifica el estado del servicio de conversaciones 1 a 1",
        tags: ["Conversations"],
        responses: {
          "200": {
            description: "Estado del servicio obtenido exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        service: {
                          type: "string",
                          example: "conversation-service"
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time"
                        },
                        features: {
                          type: "array",
                          items: {
                            type: "string"
                          },
                          example: ["Mensajes privados 1 a 1", "Gestión de conversaciones", "Historial de mensajes", "Marcado de mensajes leídos", "Paginación de conversaciones"]
                        },
                        limits: {
                          type: "object",
                          properties: {
                            maxMessageLength: {
                              type: "integer",
                              example: 5000
                            },
                            maxConversationsPerPage: {
                              type: "integer",
                              example: 50
                            },
                            maxMessagesPerPage: {
                              type: "integer",
                              example: 100
                            }
                          }
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Servicio de conversaciones funcionando correctamente"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/s3/ws-info": {
      get: {
        summary: "Información de WebSocket",
        description: "Obtiene información sobre la configuración de WebSocket",
        tags: ["WebSocket"],
        responses: {
          "200": {
            description: "Información de WebSocket obtenida",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/WebSocketInfo"
                    },
                    message: {
                      type: "string",
                      example: "Información de WebSocket obtenida"
                    },
                    status: {
                      type: "string",
                      example: "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Función para generar el archivo
function generateSwaggerFile() {
  try {
    const outputPath = path.join(__dirname, '..', 'swagger.json');
    const jsonContent = JSON.stringify(swaggerConfig, null, 2);
    
    fs.writeFileSync(outputPath, jsonContent, 'utf8');
    
    console.log('✅ Archivo swagger.json generado exitosamente');
    console.log(`📁 Ubicación: ${outputPath}`);
    console.log(`📊 Endpoints documentados: ${Object.keys(swaggerConfig.paths).length}`);
    console.log(`🏷️  Tags: ${swaggerConfig.tags.map(tag => tag.name).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error generando archivo swagger.json:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generateSwaggerFile();
}

module.exports = { generateSwaggerFile, swaggerConfig }; 