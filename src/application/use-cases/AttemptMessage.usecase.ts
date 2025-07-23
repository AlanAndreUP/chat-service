import { AttemptMessageRequest, AttemptMessageResponse, ChatAttemptsRepository } from '@domain/repositories/ChatAttemptsRepository.interface';

export class AttemptMessageUseCase {
  constructor(
    private readonly attemptsRepository: ChatAttemptsRepository
  ) {}

  async execute(request: AttemptMessageRequest): Promise<AttemptMessageResponse> {
    const fecha = request.fecha || new Date();
    const result = await this.attemptsRepository.increment(request.usuario_id, request.conversation_id, fecha);
    return { attempt: result.toJSON() };
  }
}
