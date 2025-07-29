import { Request, Response, NextFunction } from 'express';
import { FirebaseAuthService, FirebaseUser } from '@application/services/FirebaseAuthService';

declare global {
  namespace Express {
    interface Request {
      user?: FirebaseUser;
    }
  }
}

export class FirebaseAuthMiddleware {
  private firebaseAuthService: FirebaseAuthService;

  constructor() {
    this.firebaseAuthService = new FirebaseAuthService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          data: null,
          message: 'Token de autorización requerido',
          status: 'error',
          error: {
            code: 'MISSING_AUTH_TOKEN'
          }
        });
        return;
      }

      const token = authHeader.substring(7);
      const user = await this.firebaseAuthService.verifyToken(token);
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        data: null,
        message: 'Token de autorización inválido',
        status: 'error',
        error: {
          code: 'INVALID_AUTH_TOKEN'
        }
      });
    }
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await this.firebaseAuthService.verifyToken(token);
        req.user = user;
      }
      
      next();
    } catch (error) {
      next();
    }
  };

  requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          data: null,
          message: 'Autenticación requerida',
          status: 'error',
          error: {
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
        return;
      }

      const userRole = req.user.customClaims?.role;
      
      if (userRole !== role) {
        res.status(403).json({
          data: null,
          message: 'Permisos insuficientes',
          status: 'error',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        });
        return;
      }

      next();
    };
  };
} 