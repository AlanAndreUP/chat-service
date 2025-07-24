import mongoose, { Document, Schema } from 'mongoose';

export interface IAIAnalysisDocument extends Document {
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
  created_at: Date;
  updated_at: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysisDocument>({
  message_id: {
    type: String,
    required: true,
    index: true
  },
  conversation_id: {
    type: String,
    index: true
  },
  sender_id: {
    type: String,
    required: true,
    index: true
  },
  recipient_id: {
    type: String,
    required: true,
    index: true
  },
  message_content: {
    type: String,
    required: true
  },
  analysis: {
    bullying: {
      type: Boolean,
      required: true
    },
    bullying_explanation: {
      type: String,
      required: true
    },
    concern: {
      type: Boolean,
      required: true
    },
    concern_explanation: {
      type: String,
      required: true
    },
    academic_constructive: {
      type: Boolean,
      required: true
    },
    academic_explanation: {
      type: String,
      required: true
    }
  },
  is_to_ai: {
    type: Boolean,
    required: true,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Índices compuestos para consultas eficientes
AIAnalysisSchema.index({ sender_id: 1, created_at: -1 });
AIAnalysisSchema.index({ conversation_id: 1, created_at: -1 });
AIAnalysisSchema.index({ is_to_ai: 1, created_at: -1 });

// Middleware para actualizar updated_at
AIAnalysisSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const AIAnalysisModel = mongoose.model<IAIAnalysisDocument>('AIAnalysis', AIAnalysisSchema); 