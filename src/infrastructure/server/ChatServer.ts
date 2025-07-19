import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HTTPServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { createChatRoutes } from '@infrastructure/routes/chat.routes';
import { createConversationRoutes } from '@infrastructure/routes/conversation.routes';
import { connectDatabase } from '@infrastructure/database/connection';
import { ChatSocketHandler } from '@infrastructure/websocket/ChatSocket.handler';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { GeminiAIService } from '@application/services/GeminiAI.service';
import { specs } from '@infrastructure/swagger/swagger.config';

export class ChatServer {
  private app: Application;
  private httpServer: HTTPServer;
  private port: number;
  private chatSocketHandler?: ChatSocketHandler;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3003');
    
    // Crear servidor HTTP que soporta WebSockets
    this.httpServer = createServer(this.app);
    
    this.middlewares();
    this.routes();
    this.connectDB();
    this.setupWebSockets();
  }

  private middlewares(): void {
    // Configurar trust proxy para WebSockets y rate limiting
    this.app.set('trust proxy', true);
    
    // Seguridad
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false // Permitir WebSockets
    }));
    
    // CORS configurado para WebSockets
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting más permisivo para chat
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 200, // 200 requests por IP (más que otros servicios)
      message: {
        data: null,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
        status: 'error'
      },
      keyGenerator: (req) => {
        const forwardedFor = req.headers['x-forwarded-for']?.toString();
        return forwardedFor ? forwardedFor.split(',')[0].trim() : (req.ip || 'unknown');
      },
      skip: (req) => {
        // Saltar rate limiting para health checks y status
        return req.path === '/health' || req.path === '/chat/status';
      }
    });
    this.app.use(limiter);

    // Parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes(): void {
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check del servicio
     *     description: Verifica el estado general del servicio de chat
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Servicio funcionando correctamente
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
     *                     version:
     *                       type: string
     *                       example: "1.0.0"
     *                     uptime:
     *                       type: number
     *                       description: Tiempo de actividad en segundos
     *                     websockets:
     *                       type: object
     *                       properties:
     *                         connected:
     *                           type: integer
     *                           description: Número de conexiones WebSocket activas
     *                         status:
     *                           type: string
     *                           example: "running"
     *                 message:
     *                   type: string
     *                   example: "Servicio de chat funcionando correctamente"
     *                 status:
     *                   type: string
     *                   example: "success"
     */
    this.app.get('/health', (req, res) => {
      const healthData = {
        service: 'chat-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        websockets: {
          connected: this.chatSocketHandler?.getConnectionCount() || 0,
          status: 'running'
        }
      };

      res.json({
        data: healthData,
        message: 'Servicio de chat funcionando correctamente',
        status: 'success'
      });
    });

    /**
     * @swagger
     * /ws-info:
     *   get:
     *     summary: Información de WebSocket
     *     description: Obtiene información sobre la configuración de WebSocket
     *     tags: [WebSocket]
     *     responses:
     *       200:
     *         description: Información de WebSocket obtenida
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     endpoint:
     *                       type: string
     *                       example: "ws://localhost:3003"
     *                     transports:
     *                       type: array
     *                       items:
     *                         type: string
     *                       example: ["websocket", "polling"]
     *                     auth:
     *                       type: object
     *                       properties:
     *                         required:
     *                           type: boolean
     *                           example: true
     *                         method:
     *                           type: string
     *                           example: "userId in auth.userId (no JWT required)"
     *                     events:
     *                       type: object
     *                       properties:
     *                         client_to_server:
     *                           type: array
     *                           items:
     *                             type: string
     *                           example: ["send_message", "typing", "stop_typing", "join_chat", "leave_chat", "ping"]
     *                         server_to_client:
     *                           type: array
     *                           items:
     *                             type: string
     *                           example: ["message_sent", "ai_response", "user_typing", "user_connected", "user_disconnected", "error", "pong"]
     *                 message:
     *                   type: string
     *                   example: "Información de WebSocket obtenida"
     *                 status:
     *                   type: string
     *                   example: "success"
     */
    this.app.get('/ws-info', (req, res) => {
      res.json({
        data: {
          endpoint: `ws://localhost:${this.port}`,
          transports: ['websocket', 'polling'],
          auth: {
            required: true,
            method: 'userId in auth.userId (no JWT required)'
          },
          events: {
            client_to_server: [
              'send_message',
              'typing',
              'stop_typing',
              'join_chat',
              'leave_chat',
              'ping'
            ],
            server_to_client: [
              'message_sent',
              'ai_response',
              'user_typing',
              'user_connected',
              'user_disconnected',
              'error',
              'pong'
            ]
          }
        },
        message: 'Información de WebSocket obtenida',
        status: 'success'
      });
    });

    // Swagger Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Chat Service API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true
      }
    }));

    // API Documentation JSON
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    // Swagger JSON file
    this.app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile('swagger.json', { root: './' });
    });

    // Chat routes
    this.app.use('/chat', createChatRoutes());
    
    // Conversation routes
    this.app.use('/conversations', createConversationRoutes());

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        data: null,
        message: 'Endpoint no encontrado',
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          path: req.originalUrl,
          method: req.method
        }
      });
    });

    // Error handler global
    this.app.use((error: any, req: any, res: any, next: any) => {
      console.error('❌ Error no capturado:', error);
      
      res.status(500).json({
        data: null,
        message: 'Error interno del servidor',
        status: 'error',
        error: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    });
  }

  private async connectDB(): Promise<void> {
    try {
      await connectDatabase();
      console.log('📊 Chat Service: Base de datos conectada exitosamente');
    } catch (error) {
      console.error('❌ Chat Service: Error conectando a la base de datos:', error);
      process.exit(1);
    }
  }

  private setupWebSockets(): void {
    try {
      console.log('🔌 Configurando WebSockets...');
      
      // Crear dependencias para WebSockets
      const chatRepository = new MongoChatRepository();
      const geminiService = new GeminiAIService();
      const sendMessageUseCase = new SendMessageUseCase(chatRepository, geminiService);
      
      // Inicializar el manejador de WebSockets
      this.chatSocketHandler = new ChatSocketHandler(this.httpServer, sendMessageUseCase);
      
      console.log('✅ WebSockets configurados exitosamente');
      
    } catch (error) {
      console.error('❌ Error configurando WebSockets:', error);
      // No salir del proceso, WebSockets es opcional
    }
  }

  public start(): void {
    this.httpServer.listen(this.port, '0.0.0.0', () => {

      console.log(`\n🚀 Chat Service corriendo en puerto ${this.port}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📡 Endpoints disponibles:`);
      console.log(`   • Health Check:  http://localhost:${this.port}/health`);
      console.log(`   • Chat API:      http://localhost:${this.port}/chat`);
      console.log(`   • Conversations: http://localhost:${this.port}/conversations`);
      console.log(`   • WebSocket:     ws://localhost:${this.port}`);
      console.log(`   • WS Info:       http://localhost:${this.port}/ws-info`);
      console.log(`   • API Docs:      http://localhost:${this.port}/api-docs`);
      console.log(`   • API Spec:      http://localhost:${this.port}/api-docs.json`);
      console.log(`   • Swagger JSON:  http://localhost:${this.port}/swagger.json`);
      
      console.log(`\n💬 Funcionalidades de Chat:`);
      console.log(`   ✅ Chat en tiempo real con WebSockets`);
      console.log(`   ✅ Respuestas automáticas con Gemini IA`);
      console.log(`   ✅ Historial de mensajes persistente`);
      console.log(`   ✅ Sistema de intentos de chat`);
      console.log(`   ✅ Notificaciones de "está escribiendo"`);
      console.log(`   ✅ Chat privado 1 a 1 entre usuarios`);
      console.log(`   ✅ Gestión de conversaciones`);
      console.log(`   ✅ Marcado de mensajes leídos`);
      
      if (this.chatSocketHandler) {
        console.log(`\n🔌 WebSocket eventos soportados:`);
        console.log(`   📤 Cliente → Servidor: send_message, typing, join_chat`);
        console.log(`   📥 Servidor → Cliente: message_sent, ai_response, user_typing`);
        console.log(`\n📊 Conexiones WebSocket activas: ${this.chatSocketHandler.getConnectionCount()}`);
      }
      
      console.log(`\n🤖 Gemini IA configurado:`);
      const geminiService = new GeminiAIService();
      const aiInfo = geminiService.getModelInfo();
      console.log(`   • Modelo: ${aiInfo.model} (${aiInfo.provider})`);
      console.log(`   • Especialización: Educación y tutoría`);
      console.log(`   • Idioma: Español`);
      
      console.log(`\n`);
    });
  }

  public stop(): void {
    console.log('🛑 Cerrando servidor de chat...');
    this.httpServer.close();
  }

  public getApp(): Application {
    return this.app;
  }

  public getHTTPServer(): HTTPServer {
    return this.httpServer;
  }

  public getChatSocketHandler(): ChatSocketHandler | undefined {
    return this.chatSocketHandler;
  }
} 