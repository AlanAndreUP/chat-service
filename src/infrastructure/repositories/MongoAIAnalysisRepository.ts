import { AIAnalysisRepository, AIAnalysis } from '@domain/repositories/AIAnalysisRepository.interface';
import { AIAnalysisModel, IAIAnalysisDocument } from '@infrastructure/database/models/AIAnalysis.model';

export class MongoAIAnalysisRepository implements AIAnalysisRepository {
  async save(analysis: AIAnalysis): Promise<AIAnalysis> {
    try {
      const analysisDoc = new AIAnalysisModel({
        message_id: analysis.message_id,
        conversation_id: analysis.conversation_id,
        sender_id: analysis.sender_id,
        recipient_id: analysis.recipient_id,
        message_content: analysis.message_content,
        analysis: analysis.analysis,
        is_to_ai: analysis.is_to_ai
      });

      const savedAnalysis = await analysisDoc.save();
      
      return {
        id: (savedAnalysis._id as any).toString(),
        message_id: savedAnalysis.message_id,
        conversation_id: savedAnalysis.conversation_id,
        sender_id: savedAnalysis.sender_id,
        recipient_id: savedAnalysis.recipient_id,
        message_content: savedAnalysis.message_content,
        analysis: savedAnalysis.analysis,
        is_to_ai: savedAnalysis.is_to_ai,
        created_at: savedAnalysis.created_at,
        updated_at: savedAnalysis.updated_at
      };
    } catch (error) {
      console.error('Error guardando análisis de IA:', error);
      throw new Error('Error al guardar análisis de IA');
    }
  }

  async findByMessageId(messageId: string): Promise<AIAnalysis | null> {
    try {
      const analysis = await AIAnalysisModel.findOne({ message_id: messageId });
      
      if (!analysis) {
        return null;
      }

      return {
        id: (analysis._id as any).toString(),
        message_id: analysis.message_id,
        conversation_id: analysis.conversation_id,
        sender_id: analysis.sender_id,
        recipient_id: analysis.recipient_id,
        message_content: analysis.message_content,
        analysis: analysis.analysis,
        is_to_ai: analysis.is_to_ai,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at
      };
    } catch (error) {
      console.error('Error buscando análisis por message_id:', error);
      throw new Error('Error al buscar análisis de IA');
    }
  }

  async findByConversationId(conversationId: string, page: number = 1, limit: number = 10): Promise<{
    analyses: AIAnalysis[];
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
      
      const [analyses, total] = await Promise.all([
        AIAnalysisModel.find({ conversation_id: conversationId })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AIAnalysisModel.countDocuments({ conversation_id: conversationId })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        analyses: analyses.map(analysis => ({
          id: analysis._id.toString(),
          message_id: analysis.message_id,
          conversation_id: analysis.conversation_id,
          sender_id: analysis.sender_id,
          recipient_id: analysis.recipient_id,
          message_content: analysis.message_content,
          analysis: analysis.analysis,
          is_to_ai: analysis.is_to_ai,
          created_at: analysis.created_at,
          updated_at: analysis.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      console.error('Error buscando análisis por conversation_id:', error);
      throw new Error('Error al buscar análisis de IA por conversación');
    }
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{
    analyses: AIAnalysis[];
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
      
      const [analyses, total] = await Promise.all([
        AIAnalysisModel.find({ sender_id: userId })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AIAnalysisModel.countDocuments({ sender_id: userId })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        analyses: analyses.map(analysis => ({
          id: analysis._id.toString(),
          message_id: analysis.message_id,
          conversation_id: analysis.conversation_id,
          sender_id: analysis.sender_id,
          recipient_id: analysis.recipient_id,
          message_content: analysis.message_content,
          analysis: analysis.analysis,
          is_to_ai: analysis.is_to_ai,
          created_at: analysis.created_at,
          updated_at: analysis.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      console.error('Error buscando análisis por user_id:', error);
      throw new Error('Error al buscar análisis de IA por usuario');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    analyses: AIAnalysis[];
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
      
      const [analyses, total] = await Promise.all([
        AIAnalysisModel.find()
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AIAnalysisModel.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        analyses: analyses.map(analysis => ({
          id: analysis._id.toString(),
          message_id: analysis.message_id,
          conversation_id: analysis.conversation_id,
          sender_id: analysis.sender_id,
          recipient_id: analysis.recipient_id,
          message_content: analysis.message_content,
          analysis: analysis.analysis,
          is_to_ai: analysis.is_to_ai,
          created_at: analysis.created_at,
          updated_at: analysis.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      console.error('Error obteniendo todos los análisis:', error);
      throw new Error('Error al obtener todos los análisis de IA');
    }
  }
} 