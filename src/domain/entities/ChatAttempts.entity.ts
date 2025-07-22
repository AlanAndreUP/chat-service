export class ChatAttemptCounter {
  constructor(
    public readonly id: string,
    public readonly usuario_id: string,
    public readonly fecha: Date,
    public readonly conversation_id?: string,
    public readonly cantidad: number = 1
  ) {}

  static create(
    usuario_id: string,
    fecha: Date,
    conversation_id?: string
  ): ChatAttemptCounter {
    return new ChatAttemptCounter(
      `${usuario_id}_${conversation_id || 'none'}_${fecha.toISOString().split('T')[0]}`,
      usuario_id,
      fecha,
      conversation_id,
      1
    );
  }

  toJSON() {
    return {
      id: this.id,
      usuario_id: this.usuario_id,
      conversation_id: this.conversation_id,
      fecha: this.fecha,
      cantidad: this.cantidad
    };
  }
} 