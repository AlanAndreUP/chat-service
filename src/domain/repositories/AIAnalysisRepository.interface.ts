export interface AIAnalysis {
  id?: string;
  message_id: string;
  conversation_id?: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  analysis: {
    bullying: boolean;
    bullying_explanation: string;
    concern: boolean;
    concern_explanation: string;
    academic_constructive: boolean;
    academic_explanation: string;
  };
  is_to_ai: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIAnalysisRepository {
  save(analysis: AIAnalysis): Promise<AIAnalysis>;
  findByMessageId(messageId: string): Promise<AIAnalysis | null>;
  findByConversationId(conversationId: string, page?: number, limit?: number): Promise<{
    analyses: AIAnalysis[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<{
    analyses: AIAnalysis[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  findAll(page?: number, limit?: number): Promise<{
    analyses: AIAnalysis[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
} 