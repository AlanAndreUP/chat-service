export interface AIConversation {
  id?: string;
  user_id: string;
  conversation_id: string;
  messages: Array<{
    id: string;
    content: string;
    is_ai_response: boolean;
    timestamp: Date;
    analysis_id?: string;
  }>;
  total_messages: number;
  ai_responses_count: number;
  user_messages_count: number;
  first_message_at: Date;
  last_message_at: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIConversationRepository {
  save(conversation: AIConversation): Promise<AIConversation>;
  findByConversationId(conversationId: string): Promise<AIConversation | null>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<{
    conversations: AIConversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  addMessage(conversationId: string, messageId: string, content: string, isAIResponse: boolean, analysisId?: string): Promise<AIConversation>;
  findAll(page?: number, limit?: number): Promise<{
    conversations: AIConversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  deactivateConversation(conversationId: string): Promise<void>;
} 