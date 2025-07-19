export class Conversation {
  constructor(
    public readonly id: string,
    public readonly participant1_id: string,
    public readonly participant2_id: string,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
    public readonly is_active: boolean = true,
    public readonly last_message_at?: Date
  ) {}

  static create(
    participant1_id: string,
    participant2_id: string,
    id?: string
  ): Conversation {
    // Asegurar que los participantes estén ordenados para evitar duplicados
    const [p1, p2] = [participant1_id, participant2_id].sort();
    
    return new Conversation(
      id || this.generateId(),
      p1,
      p2,
      new Date(),
      new Date(),
      true
    );
  }

  static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Verificar si un usuario es participante de esta conversación
  isParticipant(userId: string): boolean {
    return this.participant1_id === userId || this.participant2_id === userId;
  }

  // Obtener el otro participante
  getOtherParticipant(userId: string): string | null {
    if (this.participant1_id === userId) {
      return this.participant2_id;
    }
    if (this.participant2_id === userId) {
      return this.participant1_id;
    }
    return null;
  }

  // Actualizar timestamp del último mensaje
  updateLastMessage(): Conversation {
    return new Conversation(
      this.id,
      this.participant1_id,
      this.participant2_id,
      this.created_at,
      new Date(),
      this.is_active,
      new Date()
    );
  }

  // Desactivar conversación
  deactivate(): Conversation {
    return new Conversation(
      this.id,
      this.participant1_id,
      this.participant2_id,
      this.created_at,
      new Date(),
      false,
      this.last_message_at
    );
  }

  toJSON() {
    return {
      id: this.id,
      participant1_id: this.participant1_id,
      participant2_id: this.participant2_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_active: this.is_active,
      last_message_at: this.last_message_at
    };
  }
} 