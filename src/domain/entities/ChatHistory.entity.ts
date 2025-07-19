import { EstadoMensaje } from '@shared/types/response.types';

export class ChatHistory {
  constructor(
    public readonly id: string,
    public readonly mensaje: string,
    public readonly estado: EstadoMensaje,
    public readonly fecha: Date,
    public readonly usuario_id: string,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
    public readonly is_ai_response: boolean = false,
    public readonly response_to_message_id?: string,
    public readonly conversation_id?: string,
    public readonly recipient_id?: string
  ) {}

  static create(
    mensaje: string,
    usuario_id: string,
    is_ai_response: boolean = false,
    response_to_message_id?: string,
    conversation_id?: string,
    recipient_id?: string,
    id?: string
  ): ChatHistory {
    return new ChatHistory(
      id || this.generateId(),
      mensaje,
      'enviado',
      new Date(),
      usuario_id,
      new Date(),
      new Date(),
      is_ai_response,
      response_to_message_id,
      conversation_id,
      recipient_id
    );
  }

  static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  updateStatus(newStatus: EstadoMensaje): ChatHistory {
    return new ChatHistory(
      this.id,
      this.mensaje,
      newStatus,
      this.fecha,
      this.usuario_id,
      this.created_at,
      new Date(), // updated_at
      this.is_ai_response,
      this.response_to_message_id,
      this.conversation_id,
      this.recipient_id
    );
  }

  markAsDelivered(): ChatHistory {
    return this.updateStatus('entregado');
  }

  markAsRead(): ChatHistory {
    return this.updateStatus('leido');
  }

  markAsFailed(): ChatHistory {
    return this.updateStatus('fallido');
  }

  isFromAI(): boolean {
    return this.is_ai_response;
  }

  isFromUser(): boolean {
    return !this.is_ai_response;
  }

  isResponse(): boolean {
    return this.response_to_message_id !== undefined;
  }

  toJSON() {
    return {
      id: this.id,
      mensaje: this.mensaje,
      estado: this.estado,
      fecha: this.fecha,
      usuario_id: this.usuario_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_ai_response: this.is_ai_response,
      response_to_message_id: this.response_to_message_id,
      conversation_id: this.conversation_id,
      recipient_id: this.recipient_id
    };
  }
} 