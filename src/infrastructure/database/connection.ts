import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_service';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Chat Service: Conectado a MongoDB exitosamente');
    
    // Eventos de conexión
    mongoose.connection.on('error', (error) => {
      console.error('❌ Chat Service: Error de conexión MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Chat Service: MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Chat Service: MongoDB reconectado');
    });

  } catch (error) {
    console.error('❌ Chat Service: Error conectando a MongoDB:', error);
    throw error;
  }
} 