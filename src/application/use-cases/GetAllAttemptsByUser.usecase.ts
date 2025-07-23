import { ChatAttemptsRepository, ChatAttemptFilters } from '@domain/repositories/ChatAttemptsRepository.interface';

export interface GetAllAttemptsRequest {
  usuario_id: string;
  page?: number;
  limit?: number;
  conversation_id?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
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
      const filters: ChatAttemptFilters = {
        usuario_id: request.usuario_id,
        conversation_id: request.conversation_id,
        fecha_desde: request.fecha_desde,
        fecha_hasta: request.fecha_hasta,
        page: request.page,
        limit: request.limit
      };
      const page = filters.page || 1;
      const limit = filters.limit || 20;

      const { attempts, total } = await this.attemptsRepository.getAllByUser(filters);
      const totalPages = Math.ceil(total / limit);

      return {
        attempts: attempts.map((attempt: any) => ({
          id: attempt._id,
          usuario_id: attempt.usuario_id,
          fecha: attempt.fecha,
          conversation_id: attempt.conversation_id,
          cantidad: attempt.cantidad
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error en GetAllAttemptsUseCase:', error);
      throw new Error('Error al obtener todos los intentos');
    }
  }
} 