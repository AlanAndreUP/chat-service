import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { FirebaseAuthService } from '@application/services/FirebaseAuthService';
import { TypingData } from '@shared/types/response.types';
import { logger } from '@shared/utils/Logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
  email?: string;
  firebaseUser?: any;
}

export class ChatSocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private firebaseAuthService: FirebaseAuthService;

  constructor(
    httpServer: HTTPServer,
    private readonly sendMessageUseCase: SendMessageUseCase
  ) {
    this.firebaseAuthService = new FirebaseAuthService();
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const firebaseToken = socket.handshake.auth.firebaseToken;

        logger.info(`WebSocket connection attempt`, 'WebSocket', { userId: socket.handshake.auth.userId });

        if (!firebaseToken) {
          throw new Error('Firebase token requerido');
        }

        const firebaseUser = await this.firebaseAuthService.verifyToken(firebaseToken);
        
        socket.userId = firebaseUser.uid;
        socket.userType = firebaseUser.customClaims?.role || 'user';
        socket.email = firebaseUser.email;
        socket.firebaseUser = firebaseUser;

        logger.info(`WebSocket connected`, 'WebSocket', { 
          userId: socket.userId, 
          userType: socket.userType 
        });
        next();

              } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('WebSocket connection failed', 'WebSocket', { error: errorMessage });
          next(new Error('Connection failed - Firebase token required'));
        }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Usuario conectado via WebSocket`, 'WebSocket', { userId: socket.userId });

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        
        socket.join(`user_${socket.userId}`);
        
        socket.broadcast.emit('user_connected', {
          userId: socket.userId,
          userType: socket.userType,
          timestamp: new Date()
        });
      }

      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('typing', (data: TypingData) => {
        this.handleTyping(socket, data);
      });

      socket.on('stop_typing', (data: TypingData) => {
        this.handleStopTyping(socket, data);
      });

      socket.on('join_chat', (data: { chatId: string }) => {
        this.handleJoinChat(socket, data);
      });

      socket.on('leave_chat', (data: { chatId: string }) => {
        this.handleLeaveChat(socket, data);
      });

      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      logger.info(`WebSocket message received`, 'WebSocket', { 
        userId: socket.userId, 
        messageLength: data.mensaje?.length 
      });

      if (!socket.userId) {
        socket.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      if (!data.mensaje || data.mensaje.trim().length === 0) {
        socket.emit('error', { message: 'Mensaje vacío' });
        return;
      }

      if (data.mensaje.length > 5000) {
        socket.emit('error', { message: 'Mensaje demasiado largo' });
        return;
      }

      const result = await this.sendMessageUseCase.execute({
        mensaje: data.mensaje,
        usuario_id: socket.userId,
        chat_estudiante_id: data.chat_estudiante_id
      });

      socket.emit('message_sent', {
        messageId: result.message.id,
        mensaje: result.message.mensaje,
        timestamp: result.message.fecha,
        status: 'sent'
      });

      socket.emit('ai_response', {
        messageId: result.ai_response?.id,
        mensaje: result.ai_response?.mensaje,
        timestamp: result.ai_response?.fecha,
        isAI: true,
        respondingTo: result.message.id
      });

      socket.to(`user_${socket.userId}`).emit('new_message', {
        from: socket.userId,
        message: data.mensaje,
        timestamp: new Date(),
        type: 'user_message'
      });

      logger.info(`WebSocket message processed`, 'WebSocket', { userId: socket.userId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing WebSocket message', 'WebSocket', { 
        userId: socket.userId, 
        error: errorMessage 
      });
      socket.emit('error', {
        message: 'Error procesando mensaje',
        code: 'MESSAGE_ERROR'
      });
    }
  }

  private handleTyping(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.userId) return;

    socket.to(`user_${socket.userId}`).emit('user_typing', {
      userId: socket.userId,
      userType: socket.userType,
      isTyping: true,
      timestamp: new Date()
    });

    logger.debug(`User typing`, 'WebSocket', { userId: socket.userId });
  }

  private handleStopTyping(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.userId) return;

    socket.to(`user_${socket.userId}`).emit('user_typing', {
      userId: socket.userId,
      userType: socket.userType,
      isTyping: false,
      timestamp: new Date()
    });

    logger.debug(`User stopped typing`, 'WebSocket', { userId: socket.userId });
  }

  private handleJoinChat(socket: AuthenticatedSocket, data: { chatId: string }): void {
    if (!socket.userId) return;

    const chatRoom = `chat_${data.chatId}`;
    socket.join(chatRoom);

    socket.to(chatRoom).emit('user_joined_chat', {
      userId: socket.userId,
      userType: socket.userType,
      chatId: data.chatId,
      timestamp: new Date()
    });

    logger.info(`User joined chat room`, 'WebSocket', { 
      userId: socket.userId, 
      chatRoom 
    });
  }

  private handleLeaveChat(socket: AuthenticatedSocket, data: { chatId: string }): void {
    if (!socket.userId) return;

    const chatRoom = `chat_${data.chatId}`;
    socket.leave(chatRoom);

    socket.to(chatRoom).emit('user_left_chat', {
      userId: socket.userId,
      userType: socket.userType,
      chatId: data.chatId,
      timestamp: new Date()
    });

    logger.info(`User left chat room`, 'WebSocket', { 
      userId: socket.userId, 
      chatRoom 
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    logger.info(`Usuario desconectado`, 'WebSocket', { 
      userId: socket.userId, 
      reason 
    });

    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);

      socket.broadcast.emit('user_disconnected', {
        userId: socket.userId,
        userType: socket.userType,
        reason,
        timestamp: new Date()
      });
    }
  }

  public sendMessageToUser(userId: string, message: any): void {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('server_message', message);
    }
  }

  public sendMessageToChat(chatId: string, message: any): void {
    this.io.to(`chat_${chatId}`).emit('chat_message', message);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getSocketIOInstance(): SocketIOServer {
    return this.io;
  }
} 