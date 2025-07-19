import dotenv from 'dotenv';
import { ChatServer } from '@infrastructure/server/ChatServer';

// Cargar variables de entorno
dotenv.config();

console.log('🚀 Iniciando Chat Service...');

// Validar variables de entorno requeridas
const requiredEnvVars = ['MONGODB_URI', 'GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars);
  console.error('💡 Asegúrate de configurar:');
  console.error('   • MONGODB_URI - URL de conexión a MongoDB');
  console.error('   • GEMINI_API_KEY - API Key de Google Gemini');
  process.exit(1);
}

// Validar variables opcionales pero recomendadas
const recommendedEnvVars = ['ALLOWED_ORIGINS'];
const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);

if (missingRecommended.length > 0) {
  console.warn('⚠️  Variables de entorno recomendadas faltantes:', missingRecommended);
  console.warn('💡 Para producción configura:');
  console.warn('   • ALLOWED_ORIGINS - Orígenes permitidos para CORS');
}

// Inicializar servidor
const chatServer = new ChatServer();

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando Chat Service...');
  chatServer.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido. Cerrando Chat Service...');
  chatServer.stop();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  chatServer.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.error('   En promesa:', promise);
  // No salir del proceso por rejection, solo loggear
});

// Iniciar el servidor
try {
  chatServer.start();
} catch (error) {
  console.error('❌ Error fatal iniciando Chat Service:', error);
  process.exit(1);
} 