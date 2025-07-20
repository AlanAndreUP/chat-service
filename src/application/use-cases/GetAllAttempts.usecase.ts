import { ChatAttemptsRepository } from '@domain/repositories/ChatAttemptsRepository.interface';

export interface GetAllAttemptsRequest {
  page?: number;
  limit?: number;
}

export interface GetAllAttemptsResponse {
  attempts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class GetAllAttemptsUseCase {
  constructor(
    private readonly attemptsRepository: ChatAttemptsRepository
  ) {}

  async execute(request: GetAllAttemptsRequest): Promise<GetAllAttemptsResponse> {
    try {
      const { page = 1, limit = 50 } = request;

      const result = await this.attemptsRepository.findAllAttempts(page, limit);

      return {
        attempts: result.attempts.map((attempt: any) => ({
          id: attempt._id,
          open_without_send: attempt.open_without_send,
          chat_estudiante_id: attempt.chat_estudiante_id,
          created_at: attempt.created_at
        })),
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error en GetAllAttemptsUseCase:', error);
      throw new Error('Error al obtener todos los intentos');
    }
  }
} 