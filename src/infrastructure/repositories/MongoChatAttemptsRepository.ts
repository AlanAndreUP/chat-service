import { ChatAttemptsRepository } from '@domain/repositories/ChatAttemptsRepository.interface';
import { ChatAttemptsModel } from '@infrastructure/database/models/ChatAttempts.model';

export class MongoChatAttemptsRepository implements ChatAttemptsRepository {
  
  async incrementAttempt(chatEstudianteId: string): Promise<any> {
    try {
      return await ChatAttemptsModel.incrementAttempt(chatEstudianteId);
    } catch (error) {
      console.error('Error incrementing attempt:', error);
      throw new Error('Error al incrementar intento de chat');
    }
  }

  async findById(id: string): Promise<any> {
    try {
      return await ChatAttemptsModel.findById(id);
    } catch (error) {
      console.error('Error finding attempt by ID:', error);
      throw new Error('Error al buscar intento por ID');
    }
  }

  async save(attempt: any): Promise<any> {
    try {
      const attemptDoc = new ChatAttemptsModel(attempt);
      return await attemptDoc.save();
    } catch (error) {
      console.error('Error saving attempt:', error);
      throw new Error('Error al guardar intento');
    }
  }

  async findByStudentChat(chatEstudianteId: string): Promise<any[]> {
    try {
      return await ChatAttemptsModel.find({ chat_estudiante_id: chatEstudianteId })
        .sort({ created_at: -1 })
        .lean();
    } catch (error) {
      console.error('Error finding attempts by student chat:', error);
      throw new Error('Error al buscar intentos por estudiante');
    }
  }

  async getAttemptStats(chatEstudianteId: string, days: number = 7): Promise<any> {
    try {
      const stats = await ChatAttemptsModel.getAttemptStats(chatEstudianteId, days);
      return stats[0] || null;
    } catch (error) {
      console.error('Error getting attempt stats:', error);
      throw new Error('Error al obtener estadísticas de intentos');
    }
  }

  async getTotalAttempts(chatEstudianteId: string): Promise<number> {
    try {
      return await ChatAttemptsModel.countDocuments({ chat_estudiante_id: chatEstudianteId });
    } catch (error) {
      console.error('Error getting total attempts:', error);
      throw new Error('Error al obtener total de intentos');
    }
  }

  async deleteOldAttempts(days: number): Promise<number> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const result = await ChatAttemptsModel.deleteMany({
        created_at: { $lt: fromDate }
      });
      
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error deleting old attempts:', error);
      throw new Error('Error al eliminar intentos antiguos');
    }
  }

  async deleteByStudentChat(chatEstudianteId: string): Promise<void> {
    try {
      await ChatAttemptsModel.deleteMany({ chat_estudiante_id: chatEstudianteId });
    } catch (error) {
      console.error('Error deleting attempts by student chat:', error);
      throw new Error('Error al eliminar intentos por estudiante');
    }
  }

  async findAllAttempts(page: number = 1, limit: number = 50): Promise<{
    attempts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [attempts, totalCount] = await Promise.all([
        ChatAttemptsModel.find({})
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatAttemptsModel.countDocuments({})
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return { attempts, pagination };
    } catch (error) {
      console.error('Error finding all attempts:', error);
      throw new Error('Error al obtener todos los intentos');
    }
  }
} 