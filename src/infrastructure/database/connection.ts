import mongoose from 'mongoose';
import { logger } from '@shared/utils/Logger';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_service';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Conectado a MongoDB exitosamente', 'Database');
    
    mongoose.connection.on('error', (error) => {
      logger.error('Error de conexión MongoDB', 'Database', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado', 'Database');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado', 'Database');
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error conectando a MongoDB', 'Database', { error: errorMessage });
    throw error;
  }
} 