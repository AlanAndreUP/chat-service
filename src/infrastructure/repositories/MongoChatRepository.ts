import { ChatRepository, ChatFilters } from '@domain/repositories/ChatRepository.interface';
import { ChatHistory } from '@domain/entities/ChatHistory.entity';
import { PaginationMeta } from '@shared/types/response.types';
import { ChatHistoryModel } from '@infrastructure/database/models/ChatHistory.model';

export class MongoChatRepository implements ChatRepository {
  
  async save(chatHistory: ChatHistory): Promise<ChatHistory> {
    try {
      const chatDoc = new ChatHistoryModel({
        _id: chatHistory.id,
        mensaje: chatHistory.mensaje,
        estado: chatHistory.estado,
        fecha: chatHistory.fecha,
        usuario_id: chatHistory.usuario_id,
        created_at: chatHistory.created_at,
        updated_at: chatHistory.updated_at,
        is_ai_response: chatHistory.is_ai_response,
        response_to_message_id: chatHistory.response_to_message_id,
        conversation_id: chatHistory.conversation_id,
        recipient_id: chatHistory.recipient_id
      });

      await chatDoc.save();

      return new ChatHistory(
        chatDoc._id,
        chatDoc.mensaje,
        chatDoc.estado,
        chatDoc.fecha,
        chatDoc.usuario_id,
        chatDoc.created_at,
        chatDoc.updated_at,
        chatDoc.is_ai_response,
        chatDoc.response_to_message_id,
        chatDoc.conversation_id,
        chatDoc.recipient_id
      );
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Error al guardar mensaje de chat');
    }
  }

  async findById(id: string): Promise<ChatHistory | null> {
    try {
      const chatDoc = await ChatHistoryModel.findById(id);
      
      if (!chatDoc) {
        return null;
      }

      return new ChatHistory(
        chatDoc._id,
        chatDoc.mensaje,
        chatDoc.estado,
        chatDoc.fecha,
        chatDoc.usuario_id,
        chatDoc.created_at,
        chatDoc.updated_at,
        chatDoc.is_ai_response,
        chatDoc.response_to_message_id,
        chatDoc.conversation_id,
        chatDoc.recipient_id
      );
    } catch (error) {
      console.error('Error finding chat message by ID:', error);
      throw new Error('Error al buscar mensaje de chat');
    }
  }

  async update(chatHistory: ChatHistory): Promise<ChatHistory> {
    try {
      const updatedDoc = await ChatHistoryModel.findByIdAndUpdate(
        chatHistory.id,
        {
          mensaje: chatHistory.mensaje,
          estado: chatHistory.estado,
          fecha: chatHistory.fecha,
          usuario_id: chatHistory.usuario_id,
          updated_at: new Date(),
          is_ai_response: chatHistory.is_ai_response,
          response_to_message_id: chatHistory.response_to_message_id,
          conversation_id: chatHistory.conversation_id,
          recipient_id: chatHistory.recipient_id
        },
        { new: true }
      );

      if (!updatedDoc) {
        throw new Error('Mensaje no encontrado');
      }

      return new ChatHistory(
        updatedDoc._id,
        updatedDoc.mensaje,
        updatedDoc.estado,
        updatedDoc.fecha,
        updatedDoc.usuario_id,
        updatedDoc.created_at,
        updatedDoc.updated_at,
        updatedDoc.is_ai_response,
        updatedDoc.response_to_message_id,
        updatedDoc.conversation_id,
        updatedDoc.recipient_id
      );
    } catch (error) {
      console.error('Error updating chat message:', error);
      throw new Error('Error al actualizar mensaje de chat');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await ChatHistoryModel.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw new Error('Error al eliminar mensaje de chat');
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ChatHistory[]> {
    try {
      const chatDocs = await ChatHistoryModel.find({ usuario_id: userId })
        .sort({ fecha: -1 })
        .limit(limit)
        .lean();

      return chatDocs.map(doc => new ChatHistory(
        doc._id,
        doc.mensaje,
        doc.estado,
        doc.fecha,
        doc.usuario_id,
        doc.created_at,
        doc.updated_at,
        doc.is_ai_response,
        doc.response_to_message_id,
        doc.conversation_id,
        doc.recipient_id
      ));
    } catch (error) {
      console.error('Error finding messages by user ID:', error);
      throw new Error('Error al buscar mensajes por usuario');
    }
  }

  async findConversationHistory(userId: string, filters?: ChatFilters): Promise<{
    messages: ChatHistory[];
    pagination: PaginationMeta;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Construir query
      const query: any = { usuario_id: userId };

      if (filters?.is_ai_response !== undefined) {
        query.is_ai_response = filters.is_ai_response;
      }

      if (filters?.fecha_desde || filters?.fecha_hasta) {
        query.fecha = {};
        if (filters.fecha_desde) {
          query.fecha.$gte = filters.fecha_desde;
        }
        if (filters.fecha_hasta) {
          query.fecha.$lte = filters.fecha_hasta;
        }
      }

      // Ejecutar consultas en paralelo
      const [chatDocs, totalCount] = await Promise.all([
        ChatHistoryModel.find(query)
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatHistoryModel.countDocuments(query)
      ]);

      const messages = chatDocs.map(doc => new ChatHistory(
        doc._id,
        doc.mensaje,
        doc.estado,
        doc.fecha,
        doc.usuario_id,
        doc.created_at,
        doc.updated_at,
        doc.is_ai_response,
        doc.response_to_message_id,
        doc.conversation_id,
        doc.recipient_id
      ));

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationMeta = {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return { messages, pagination };
    } catch (error) {
      console.error('Error finding conversation history:', error);
      throw new Error('Error al obtener historial de conversación');
    }
  }

  async findWithFilters(filters: ChatFilters): Promise<{
    messages: ChatHistory[];
    pagination: PaginationMeta;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Construir query dinámico
      const query: any = {};

      if (filters.usuario_id) {
        query.usuario_id = filters.usuario_id;
      }

      if (filters.is_ai_response !== undefined) {
        query.is_ai_response = filters.is_ai_response;
      }

      if (filters.fecha_desde || filters.fecha_hasta) {
        query.fecha = {};
        if (filters.fecha_desde) {
          query.fecha.$gte = filters.fecha_desde;
        }
        if (filters.fecha_hasta) {
          query.fecha.$lte = filters.fecha_hasta;
        }
      }

      const [chatDocs, totalCount] = await Promise.all([
        ChatHistoryModel.find(query)
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatHistoryModel.countDocuments(query)
      ]);

      const messages = chatDocs.map(doc => new ChatHistory(
        doc._id,
        doc.mensaje,
        doc.estado,
        doc.fecha,
        doc.usuario_id,
        doc.created_at,
        doc.updated_at,
        doc.is_ai_response,
        doc.response_to_message_id,
        doc.conversation_id,
        doc.recipient_id
      ));

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationMeta = {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return { messages, pagination };
    } catch (error) {
      console.error('Error finding messages with filters:', error);
      throw new Error('Error al buscar mensajes con filtros');
    }
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      await ChatHistoryModel.updateMany(
        { _id: { $in: messageIds } },
        { 
          estado: 'leido',
          updated_at: new Date()
        }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Error al marcar mensajes como leídos');
    }
  }

  async markAsDelivered(messageIds: string[]): Promise<void> {
    try {
      await ChatHistoryModel.updateMany(
        { _id: { $in: messageIds } },
        { 
          estado: 'entregado',
          updated_at: new Date()
        }
      );
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
      throw new Error('Error al marcar mensajes como entregados');
    }
  }

  async countMessagesByUser(userId: string, days?: number): Promise<number> {
    try {
      const query: any = { usuario_id: userId };

      if (days) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query.fecha = { $gte: fromDate };
      }

      return await ChatHistoryModel.countDocuments(query);
    } catch (error) {
      console.error('Error counting messages by user:', error);
      throw new Error('Error al contar mensajes por usuario');
    }
  }

  async findLastMessage(userId: string): Promise<ChatHistory | null> {
    try {
      const chatDoc = await ChatHistoryModel.findOne({ usuario_id: userId })
        .sort({ fecha: -1 })
        .lean();

      if (!chatDoc) {
        return null;
      }

      return new ChatHistory(
        chatDoc._id,
        chatDoc.mensaje,
        chatDoc.estado,
        chatDoc.fecha,
        chatDoc.usuario_id,
        chatDoc.created_at,
        chatDoc.updated_at,
        chatDoc.is_ai_response,
        chatDoc.response_to_message_id,
        chatDoc.conversation_id,
        chatDoc.recipient_id
      );
    } catch (error) {
      console.error('Error finding last message:', error);
      throw new Error('Error al buscar último mensaje');
    }
  }

  async findResponseToMessage(messageId: string): Promise<ChatHistory | null> {
    try {
      const chatDoc = await ChatHistoryModel.findOne({ 
        response_to_message_id: messageId 
      }).lean();

      if (!chatDoc) {
        return null;
      }

      return new ChatHistory(
        chatDoc._id,
        chatDoc.mensaje,
        chatDoc.estado,
        chatDoc.fecha,
        chatDoc.usuario_id,
        chatDoc.created_at,
        chatDoc.updated_at,
        chatDoc.is_ai_response,
        chatDoc.response_to_message_id,
        chatDoc.conversation_id,
        chatDoc.recipient_id
      );
    } catch (error) {
      console.error('Error finding response to message:', error);
      throw new Error('Error al buscar respuesta al mensaje');
    }
  }

  async findRecentConversations(userId: string, limit: number = 10): Promise<ChatHistory[]> {
    try {
      const chatDocs = await ChatHistoryModel.find({ usuario_id: userId })
        .sort({ fecha: -1 })
        .limit(limit)
        .lean();

      return chatDocs.map(doc => new ChatHistory(
        doc._id,
        doc.mensaje,
        doc.estado,
        doc.fecha,
        doc.usuario_id,
        doc.created_at,
        doc.updated_at,
        doc.is_ai_response,
        doc.response_to_message_id,
        doc.conversation_id,
        doc.recipient_id
      ));
    } catch (error) {
      console.error('Error finding recent conversations:', error);
      throw new Error('Error al buscar conversaciones recientes');
    }
  }

  async deleteConversation(userId: string): Promise<void> {
    try {
      await ChatHistoryModel.deleteMany({ usuario_id: userId });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Error al eliminar conversación');
    }
  }

  async findByConversationId(conversationId: string, limit: number = 50, skip: number = 0): Promise<ChatHistory[]> {
    try {
      const chatDocs = await ChatHistoryModel.find({ conversation_id: conversationId })
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return chatDocs.map(doc => new ChatHistory(
        doc._id,
        doc.mensaje,
        doc.estado,
        doc.fecha,
        doc.usuario_id,
        doc.created_at,
        doc.updated_at,
        doc.is_ai_response,
        doc.response_to_message_id,
        doc.conversation_id,
        doc.recipient_id
      ));
    } catch (error) {
      console.error('Error finding messages by conversation ID:', error);
      throw new Error('Error al buscar mensajes por conversación');
    }
  }
} 