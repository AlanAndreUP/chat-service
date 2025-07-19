import mongoose, { Schema, Document } from 'mongoose';

export interface IChatAttemptsDocument extends Document {
  _id: string;
  open_without_send: number;
  chat_estudiante_id: string;
  created_at: Date;
}

const ChatAttemptsSchema = new Schema<IChatAttemptsDocument>({
  _id: {
    type: String,
    required: true
  },
  open_without_send: {
    type: Number,
    default: 1,
    min: 0,
    required: true
  },
  chat_estudiante_id: {
    type: String,
    required: true,
    ref: 'ChatPorEstudiante',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false,
  timestamps: false
});

// Índices para optimizar consultas
ChatAttemptsSchema.index({ chat_estudiante_id: 1, created_at: -1 });
ChatAttemptsSchema.index({ created_at: -1 }); // Para reports y estadísticas

// Método estático para incrementar intentos
ChatAttemptsSchema.statics.incrementAttempt = async function(chatEstudianteId: string) {
  // Buscar el registro más reciente del día actual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingAttempt = await this.findOne({
    chat_estudiante_id: chatEstudianteId,
    created_at: { $gte: today }
  });

  if (existingAttempt) {
    // Incrementar contador existente
    existingAttempt.open_without_send += 1;
    return existingAttempt.save();
  } else {
    // Crear nuevo registro
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newAttempt = new this({
      _id: newId,
      open_without_send: 1,
      chat_estudiante_id: chatEstudianteId,
      created_at: new Date()
    });
    return newAttempt.save();
  }
};

// Método estático para generar ID
ChatAttemptsSchema.statics.generateId = function(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Método estático para obtener estadísticas de intentos
ChatAttemptsSchema.statics.getAttemptStats = function(chatEstudianteId: string, days = 7) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        chat_estudiante_id: chatEstudianteId,
        created_at: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: '$open_without_send' },
        avgAttemptsPerDay: { $avg: '$open_without_send' },
        maxAttemptsInDay: { $max: '$open_without_send' },
        daysWithAttempts: { $sum: 1 }
      }
    }
  ]);
};

export const ChatAttemptsModel = mongoose.model<IChatAttemptsDocument>('ChatAttempts', ChatAttemptsSchema); 