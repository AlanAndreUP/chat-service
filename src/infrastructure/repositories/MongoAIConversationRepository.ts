import { AIConversationRepository, AIConversation } from '@domain/repositories/AIConversationRepository.interface';
import { AIConversationModel, IAIConversationDocument } from '@infrastructure/database/models/AIConversation.model';

export class MongoAIConversationRepository implements AIConversationRepository {
  async save(conversation: AIConversation): Promise<AIConversation> {
    try {
      const conversationDoc = new AIConversationModel({
        user_id: conversation.user_id,
        conversation_id: conversation.conversation_id,
        messages: conversation.messages,
        total_messages: conversation.total_messages,
        ai_responses_count: conversation.ai_responses_count,
        user_messages_count: conversation.user_messages_count,
        first_message_at: conversation.first_message_at,
        last_message_at: conversation.last_message_at,
        is_active: conversation.is_active
      });

      const savedConversation = await conversationDoc.save();
      
      return {
        id: (savedConversation._id as any).toString(),
        user_id: savedConversation.user_id,
        conversation_id: savedConversation.conversation_id,
        messages: savedConversation.messages,
        total_messages: savedConversation.total_messages,
        ai_responses_count: savedConversation.ai_responses_count,
        user_messages_count: savedConversation.user_messages_count,
        first_message_at: savedConversation.first_message_at,
        last_message_at: savedConversation.last_message_at,
        is_active: savedConversation.is_active,
        created_at: savedConversation.created_at,
        updated_at: savedConversation.updated_at
      };
    } catch (error) {
      console.error('Error guardando conversación con IA:', error);
      throw new Error('Error al guardar conversación con IA');
    }
  }

  async findByConversationId(conversationId: string): Promise<AIConversation | null> {
    try {
      const conversation = await AIConversationModel.findOne({ conversation_id: conversationId });
      
      if (!conversation) {
        return null;
      }

      return {
        id: (conversation._id as any).toString(),
        user_id: conversation.user_id,
        conversation_id: conversation.conversation_id,
        messages: conversation.messages,
        total_messages: conversation.total_messages,
        ai_responses_count: conversation.ai_responses_count,
        user_messages_count: conversation.user_messages_count,
        first_message_at: conversation.first_message_at,
        last_message_at: conversation.last_message_at,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      };
    } catch (error) {
      console.error('Error buscando conversación por conversation_id:', error);
      throw new Error('Error al buscar conversación con IA');
    }
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{
    conversations: AIConversation[];
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
      
      const [conversations, total] = await Promise.all([
        AIConversationModel.find({ user_id: userId })
          .sort({ last_message_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AIConversationModel.countDocuments({ user_id: userId })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        conversations: conversations.map(conversation => ({
          id: (conversation._id as any).toString(),
          user_id: conversation.user_id,
          conversation_id: conversation.conversation_id,
          messages: conversation.messages,
          total_messages: conversation.total_messages,
          ai_responses_count: conversation.ai_responses_count,
          user_messages_count: conversation.user_messages_count,
          first_message_at: conversation.first_message_at,
          last_message_at: conversation.last_message_at,
          is_active: conversation.is_active,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
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
      console.error('Error buscando conversaciones por user_id:', error);
      throw new Error('Error al buscar conversaciones con IA por usuario');
    }
  }

  async addMessage(conversationId: string, messageId: string, content: string, isAIResponse: boolean, analysisId?: string): Promise<AIConversation> {
    try {
      const conversation = await AIConversationModel.findOne({ conversation_id: conversationId });
      
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }
      await conversation.addMessage(messageId, content, isAIResponse, analysisId);
      
      return {
        id: (conversation._id as any).toString(),
        user_id: conversation.user_id,
        conversation_id: conversation.conversation_id,
        messages: conversation.messages,
        total_messages: conversation.total_messages,
        ai_responses_count: conversation.ai_responses_count,
        user_messages_count: conversation.user_messages_count,
        first_message_at: conversation.first_message_at,
        last_message_at: conversation.last_message_at,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      };
    } catch (error) {
      console.error('Error agregando mensaje a conversación:', error);
      throw new Error('Error al agregar mensaje a conversación con IA');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    conversations: AIConversation[];
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
      
      const [conversations, total] = await Promise.all([
        AIConversationModel.find()
          .sort({ last_message_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AIConversationModel.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        conversations: conversations.map(conversation => ({
          id: (conversation._id as any).toString(),
          user_id: conversation.user_id,
          conversation_id: conversation.conversation_id,
          messages: conversation.messages,
          total_messages: conversation.total_messages,
          ai_responses_count: conversation.ai_responses_count,
          user_messages_count: conversation.user_messages_count,
          first_message_at: conversation.first_message_at,
          last_message_at: conversation.last_message_at,
          is_active: conversation.is_active,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
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
      console.error('Error obteniendo todas las conversaciones con IA:', error);
      throw new Error('Error al obtener todas las conversaciones con IA');
    }
  }

  async deactivateConversation(conversationId: string): Promise<void> {
    try {
      await AIConversationModel.updateOne(
        { conversation_id: conversationId },
        { is_active: false }
      );
    } catch (error) {
      console.error('Error desactivando conversación:', error);
      throw new Error('Error al desactivar conversación con IA');
    }
  }
} 