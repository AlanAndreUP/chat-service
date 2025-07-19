export interface ChatAttempt {
  id: string;
  open_without_send: number;
  chat_estudiante_id: string;
  created_at: Date;
}

export interface AttemptStats {
  totalAttempts: number;
  avgAttemptsPerDay: number;
  maxAttemptsInDay: number;
  daysWithAttempts: number;
}

export interface ChatAttemptsRepository {
  // Operaciones básicas
  save(attempt: ChatAttempt): Promise<ChatAttempt>;
  findById(id: string): Promise<ChatAttempt | null>;
  
  // Operaciones específicas de intentos
  incrementAttempt(chatEstudianteId: string): Promise<ChatAttempt>;
  
  // Consultas por chat-estudiante
  findByStudentChat(chatEstudianteId: string, days?: number): Promise<ChatAttempt[]>;
  
  // Estadísticas
  getAttemptStats(chatEstudianteId: string, days?: number): Promise<AttemptStats | null>;
  getTotalAttempts(chatEstudianteId: string, days?: number): Promise<number>;
  
  // Operaciones de limpieza
  deleteOldAttempts(daysOld: number): Promise<number>;
  deleteByStudentChat(chatEstudianteId: string): Promise<void>;
} 