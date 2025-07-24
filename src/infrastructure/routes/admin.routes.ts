import { Router } from 'express';
import { AdminController } from '@infrastructure/controllers/Admin.controller';
import { GetAllConversationsUseCase } from '@application/use-cases/GetAllConversations.usecase';
import { GetAllMessagesUseCase } from '@application/use-cases/GetAllMessages.usecase';
import { GetAllAttemptsUseCase } from '@application/use-cases/GetAllAttemptsByUser.usecase';
import { MongoConversationRepository } from '@infrastructure/repositories/MongoConversationRepository';
import { MongoChatRepository } from '@infrastructure/repositories/MongoChatRepository';
import { MongoChatAttemptsRepository } from '@infrastructure/repositories/MongoChatAttemptsRepository';
import { EmailService } from '@application/services/EmailService';

export function createAdminRoutes(): Router {
  const router = Router();
  
  // Dependencias
  const conversationRepository = new MongoConversationRepository();
  const chatRepository = new MongoChatRepository();
  const attemptsRepository = new MongoChatAttemptsRepository();
  const emailService = new EmailService();
  
  // Casos de uso
  const getAllConversationsUseCase = new GetAllConversationsUseCase(conversationRepository);
  const getAllMessagesUseCase = new GetAllMessagesUseCase(chatRepository);
  const getAllAttemptsUseCase = new GetAllAttemptsUseCase(attemptsRepository);
  
  // Controlador
  const adminController = new AdminController(
    getAllConversationsUseCase,
    getAllMessagesUseCase,
    getAllAttemptsUseCase,
    emailService
  );

  // Rutas administrativas
  router.get('/conversations', adminController.getAllConversations);
  router.get('/messages', adminController.getAllMessages);
  router.get('/attempts', adminController.getAllAttempts);
  router.get('/status', adminController.getSystemStatus);
  router.get('/tutors', adminController.getTutorsInfo);

  return router;
} 