import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SendMessageUseCase } from '@application/use-cases/SendMessage.usecase';
import { SocketAuthData, SocketMessage, TypingData } from '@shared/types/response.types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
  email?: string;
}

export class ChatSocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    httpServer: HTTPServer,
    private readonly sendMessageUseCase: SendMessageUseCase
  ) {
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
    // Middleware simplificado sin JWT - solo requiere userId
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const userId = socket.handshake.auth.userId;

        console.log(`🔐 WebSocket connection attempt for user: ${userId}`);

        if (!userId) {
          throw new Error('userId requerido en auth');
        }

        // Adjuntar información del usuario al socket
        socket.userId = userId;
        socket.userType = socket.handshake.auth.userType || 'user';
        socket.email = socket.handshake.auth.email;

        console.log(`✅ WebSocket connected: ${socket.userId} (${socket.userType})`);
        next();

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        next(new Error('Connection failed - userId required'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 Usuario conectado via WebSocket: ${socket.userId}`);

      // Agregar usuario a la lista de conectados
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        
        // Unirse a su sala personal (para recibir mensajes dirigidos)
        socket.join(`user_${socket.userId}`);
        
        // Notificar que el usuario se conectó
        socket.broadcast.emit('user_connected', {
          userId: socket.userId,
          userType: socket.userType,
          timestamp: new Date()
        });
      }

      // Manejar envío de mensajes via WebSocket
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Manejar notificaciones de "está escribiendo"
      socket.on('typing', (data: TypingData) => {
        this.handleTyping(socket, data);
      });

      // Manejar cuando deja de escribir
      socket.on('stop_typing', (data: TypingData) => {
        this.handleStopTyping(socket, data);
      });

      // Manejar unirse a sala de chat específica
      socket.on('join_chat', (data: { chatId: string }) => {
        this.handleJoinChat(socket, data);
      });

      // Manejar salir de sala de chat
      socket.on('leave_chat', (data: { chatId: string }) => {
        this.handleLeaveChat(socket, data);
      });

      // Manejar desconexión
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      // Manejar ping/pong para mantener conexión viva
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      console.log(`💬 WebSocket message from ${socket.userId}:`, data);

      if (!socket.userId) {
        socket.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      // Validar datos del mensaje
      if (!data.mensaje || data.mensaje.trim().length === 0) {
        socket.emit('error', { message: 'Mensaje vacío' });
        return;
      }

      if (data.mensaje.length > 5000) {
        socket.emit('error', { message: 'Mensaje demasiado largo' });
        return;
      }

      // Usar el caso de uso para procesar el mensaje
      const result = await this.sendMessageUseCase.execute({
        mensaje: data.mensaje,
        usuario_id: socket.userId,
        chat_estudiante_id: data.chat_estudiante_id
      });

      // Emitir mensaje confirmado al usuario que lo envió
      socket.emit('message_sent', {
        messageId: result.message.id,
        mensaje: result.message.mensaje,
        timestamp: result.message.fecha,
        status: 'sent'
      });

      // Emitir respuesta de IA
      socket.emit('ai_response', {
        messageId: result.ai_response?.id,
        mensaje: result.ai_response?.mensaje,
        timestamp: result.ai_response?.fecha,
        isAI: true,
        respondingTo: result.message.id
      });

      // Si hay otros usuarios conectados en la misma sala, notificarles
      socket.to(`user_${socket.userId}`).emit('new_message', {
        from: socket.userId,
        message: data.mensaje,
        timestamp: new Date(),
        type: 'user_message'
      });

      console.log(`✅ WebSocket message processed for ${socket.userId}`);

    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      socket.emit('error', {
        message: 'Error procesando mensaje',
        code: 'MESSAGE_ERROR'
      });
    }
  }

  private handleTyping(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.userId) return;

    // Notificar a otros usuarios en la misma sala que este usuario está escribiendo
    socket.to(`user_${socket.userId}`).emit('user_typing', {
      userId: socket.userId,
      userType: socket.userType,
      isTyping: true,
      timestamp: new Date()
    });

    console.log(`⌨️  ${socket.userId} is typing`);
  }

  private handleStopTyping(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.userId) return;

    socket.to(`user_${socket.userId}`).emit('user_typing', {
      userId: socket.userId,
      userType: socket.userType,
      isTyping: false,
      timestamp: new Date()
    });

    console.log(`⌨️  ${socket.userId} stopped typing`);
  }

  private handleJoinChat(socket: AuthenticatedSocket, data: { chatId: string }): void {
    if (!socket.userId) return;

    const chatRoom = `chat_${data.chatId}`;
    socket.join(chatRoom);

    // Notificar a otros en la sala
    socket.to(chatRoom).emit('user_joined_chat', {
      userId: socket.userId,
      userType: socket.userType,
      chatId: data.chatId,
      timestamp: new Date()
    });

    console.log(`👥 ${socket.userId} joined chat room: ${chatRoom}`);
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

    console.log(`👥 ${socket.userId} left chat room: ${chatRoom}`);
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    console.log(`🔌 Usuario desconectado: ${socket.userId} - Razón: ${reason}`);

    if (socket.userId) {
      // Remover de la lista de usuarios conectados
      this.connectedUsers.delete(socket.userId);

      // Notificar a otros usuarios
      socket.broadcast.emit('user_disconnected', {
        userId: socket.userId,
        userType: socket.userType,
        reason,
        timestamp: new Date()
      });
    }
  }

  // Métodos públicos para enviar mensajes desde el servidor
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

  // Método para health check
  public getSocketIOInstance(): SocketIOServer {
    return this.io;
  }
} 