import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HTTPServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { createChatRoutes } from '@infrastructure/routes/chat.routes';
import { createConversationRoutes } from '@infrastructure/routes/conversation.routes';
import { createAdminRoutes } from '@infrastructure/routes/admin.routes';
import { connectDatabase } from '@infrastructure/database/connection';
import { ChatSocketHandler } from '@infrastructure/websocket/ChatSocket.handler';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { GeminiAIService } from '@application/services/GeminiAI.service';
import { specs } from '@infrastructure/swagger/swagger.config';
import { EmailService } from '@/application/services/EmailService';
import { MongoAIAnalysisRepository } from '../repositories/MongoAIAnalysisRepository';
import { MongoAIConversationRepository } from '../repositories/MongoAIConversationRepository';
import { logger } from '@shared/utils/Logger';

export class ChatServer {
  private readonly app: Application;
  private readonly httpServer: HTTPServer;
  private readonly port: number;
  private chatSocketHandler?: ChatSocketHandler;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3003');

    this.httpServer = createServer(this.app);
    
    this.middlewares();
    this.routes();
    this.connectDB();
    this.setupWebSockets();
  }

  private middlewares(): void {
    this.app.set('trust proxy', true);
    
    this.app.use(helmet({
        crossOriginEmbedderPolicy: false
    }));
    
    this.app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'Origin', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Length', 'X-User-ID']
    }));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: {
        data: null,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
        status: 'error'
      },
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
      },
      skip: (req) => {
        return req.path === '/s3/health' || req.path === '/s3/chat/status';
      }
    });
    this.app.use(limiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  private routes(): void {
    const API_PREFIX = '/s3';
    
    /**
     * @swagger
     * /s3/health:
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
    this.app.get(`${API_PREFIX}/health`, (req, res) => {
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
     * /s3/ws-info:
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
    this.app.get(`${API_PREFIX}/ws-info`, (req, res) => {
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

    this.app.use(`${API_PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(specs, {
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

    this.app.get(`${API_PREFIX}/api-docs.json`, (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    this.app.get(`${API_PREFIX}/swagger.json`, (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile('swagger.json', { root: './' });
    });

    this.app.use(`${API_PREFIX}/chat`, createChatRoutes());
    
    this.app.use(`${API_PREFIX}/conversations`, createConversationRoutes());

    this.app.use(`${API_PREFIX}/admin`, createAdminRoutes());

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
      logger.info('Base de datos conectada exitosamente', 'ChatServer');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error conectando a la base de datos', 'ChatServer', { 
        error: errorMessage 
      });
      process.exit(1);
    }
  }

  private setupWebSockets(): void {
    try {
      logger.info('Configurando WebSockets', 'ChatServer');
      
      const chatRepository = new MongoChatRepository();
      const geminiService = new GeminiAIService();
      const emailService = new EmailService();
      const aiAnalysisRepository = new MongoAIAnalysisRepository();
      const aiConversationRepository = new MongoAIConversationRepository();
      const sendMessageUseCase = new SendMessageUseCase(chatRepository, geminiService, emailService, aiAnalysisRepository, aiConversationRepository);
      
      this.chatSocketHandler = new ChatSocketHandler(this.httpServer, sendMessageUseCase);
      logger.info('WebSockets configurados exitosamente', 'ChatServer');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error configurando WebSockets', 'ChatServer', { 
        error: errorMessage 
      });
    }
  }

  public start(): void {
    this.httpServer.listen(this.port, '0.0.0.0', () => {
      logger.info('Chat Service iniciado', 'ChatServer', {
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        websocketConnections: this.chatSocketHandler?.getConnectionCount() || 0
      });
    });
  }

  public stop(): void {
    logger.info('Cerrando servidor de chat', 'ChatServer');
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