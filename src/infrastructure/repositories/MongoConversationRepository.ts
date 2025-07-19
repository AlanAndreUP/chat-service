import { ConversationRepository } from '@domain/repositories/ConversationRepository.interface';
import { Conversation } from '@domain/entities/Conversation.entity';
import { ConversationModel } from '@infrastructure/database/models/Conversation.model';

export class MongoConversationRepository implements ConversationRepository {
  
  async findOrCreateConversation(participant1_id: string, participant2_id: string): Promise<Conversation> {
    try {
      const [p1, p2] = [participant1_id, participant2_id].sort();
      
      let conversationDoc = await ConversationModel.findOne({
        participant1_id: p1,
        participant2_id: p2,
        is_active: true
      });

      if (!conversationDoc) {
        const conversationId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        conversationDoc = new ConversationModel({
          _id: conversationId,
          participant1_id: p1,
          participant2_id: p2,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true
        });
        await conversationDoc.save();
      }

      return new Conversation(
        conversationDoc._id,
        conversationDoc.participant1_id,
        conversationDoc.participant2_id,
        conversationDoc.created_at,
        conversationDoc.updated_at,
        conversationDoc.is_active,
        conversationDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en findOrCreateConversation:', error);
      throw new Error('Error al crear o encontrar conversación');
    }
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationDoc = await ConversationModel.findById(conversationId);
      
      if (!conversationDoc) {
        return null;
      }

      return new Conversation(
        conversationDoc._id,
        conversationDoc.participant1_id,
        conversationDoc.participant2_id,
        conversationDoc.created_at,
        conversationDoc.updated_at,
        conversationDoc.is_active,
        conversationDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar conversación por ID');
    }
  }

  async findByParticipant(userId: string, limit: number = 20): Promise<Conversation[]> {
    try {
      const conversationsDoc = await ConversationModel.find({
        $or: [
          { participant1_id: userId },
          { participant2_id: userId }
        ],
        is_active: true
      })
      .sort({ last_message_at: -1, updated_at: -1 })
      .limit(limit)
      .lean()
      .exec();
      
      return conversationsDoc.map((doc: any) => new Conversation(
        doc._id,
        doc.participant1_id,
        doc.participant2_id,
        doc.created_at,
        doc.updated_at,
        doc.is_active,
        doc.last_message_at
      ));
    } catch (error) {
      console.error('Error en findByParticipant:', error);
      throw new Error('Error al buscar conversaciones del participante');
    }
  }

  async findByParticipants(participant1_id: string, participant2_id: string): Promise<Conversation | null> {
    try {
      const [p1, p2] = [participant1_id, participant2_id].sort();
      
      const conversationDoc = await ConversationModel.findOne({
        participant1_id: p1,
        participant2_id: p2,
        is_active: true
      });

      if (!conversationDoc) {
        return null;
      }

      return new Conversation(
        conversationDoc._id,
        conversationDoc.participant1_id,
        conversationDoc.participant2_id,
        conversationDoc.created_at,
        conversationDoc.updated_at,
        conversationDoc.is_active,
        conversationDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en findByParticipants:', error);
      throw new Error('Error al buscar conversación entre participantes');
    }
  }

  async save(conversation: Conversation): Promise<Conversation> {
    try {
      const conversationDoc = new ConversationModel({
        _id: conversation.id,
        participant1_id: conversation.participant1_id,
        participant2_id: conversation.participant2_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        is_active: conversation.is_active,
        last_message_at: conversation.last_message_at
      });

      const savedDoc = await conversationDoc.save();
      
      return new Conversation(
        savedDoc._id,
        savedDoc.participant1_id,
        savedDoc.participant2_id,
        savedDoc.created_at,
        savedDoc.updated_at,
        savedDoc.is_active,
        savedDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en save:', error);
      throw new Error('Error al guardar conversación');
    }
  }

  async updateLastMessage(conversationId: string): Promise<Conversation> {
    try {
      const conversationDoc = await ConversationModel.findByIdAndUpdate(
        conversationId,
        {
          last_message_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      );

      if (!conversationDoc) {
        throw new Error('Conversación no encontrada');
      }

      return new Conversation(
        conversationDoc._id,
        conversationDoc.participant1_id,
        conversationDoc.participant2_id,
        conversationDoc.created_at,
        conversationDoc.updated_at,
        conversationDoc.is_active,
        conversationDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en updateLastMessage:', error);
      throw new Error('Error al actualizar timestamp del último mensaje');
    }
  }

  async deactivate(conversationId: string): Promise<Conversation> {
    try {
      const conversationDoc = await ConversationModel.findByIdAndUpdate(
        conversationId,
        {
          is_active: false,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!conversationDoc) {
        throw new Error('Conversación no encontrada');
      }

      return new Conversation(
        conversationDoc._id,
        conversationDoc.participant1_id,
        conversationDoc.participant2_id,
        conversationDoc.created_at,
        conversationDoc.updated_at,
        conversationDoc.is_active,
        conversationDoc.last_message_at
      );
    } catch (error) {
      console.error('Error en deactivate:', error);
      throw new Error('Error al desactivar conversación');
    }
  }

  async delete(conversationId: string): Promise<boolean> {
    try {
      const result = await ConversationModel.findByIdAndDelete(conversationId);
      return !!result;
    } catch (error) {
      console.error('Error en delete:', error);
      throw new Error('Error al eliminar conversación');
    }
  }
} 