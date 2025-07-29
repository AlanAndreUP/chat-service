import { logger } from '@shared/utils/Logger';

interface Tutor {
  id: string;
  nombre: string;
  correo: string;
}

interface TutorsResponse {
  data: {
    tutors: Tutor[];
    total: number;
  };
  message: string;
  status: string;
}

export class AuthService {
  private readonly baseUrl = 'https://api.psicodemy.com';
  private tutorsCache: Map<string, Tutor> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly cacheExpirationTime = 5 * 60 * 1000;

  async getTutorEmail(tutorId: string): Promise<string | null> {
    try {
      if (this.isCacheValid()) {
        const cachedTutor = this.tutorsCache.get(tutorId);
        if (cachedTutor) {
          logger.debug(`Email encontrado en cache`, 'AuthService', { 
            tutorId, 
            email: cachedTutor.correo 
          });
          return cachedTutor.correo;
        }
      }

      await this.updateTutorsCache();

      const tutor = this.tutorsCache.get(tutorId);
      if (tutor) {
        logger.debug(`Email obtenido de API`, 'AuthService', { 
          tutorId, 
          email: tutor.correo 
        });
        return tutor.correo;
      }

      logger.warn(`Tutor no encontrado`, 'AuthService', { tutorId });
      return null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo email del tutor', 'AuthService', { 
        tutorId, 
        error: errorMessage 
      });
      return null;
    }
  }

  async getTutorInfo(tutorId: string): Promise<Tutor | null> {
    try {
      if (this.isCacheValid()) {
        return this.tutorsCache.get(tutorId) || null;
      }

      await this.updateTutorsCache();
      return this.tutorsCache.get(tutorId) || null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo información del tutor', 'AuthService', { 
        tutorId, 
        error: errorMessage 
      });
      return null;
    }
  }

  async getAllTutors(): Promise<Tutor[]> {
    try {
      if (!this.isCacheValid()) {
        await this.updateTutorsCache();
      }

      return Array.from(this.tutorsCache.values());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo todos los tutores', 'AuthService', { 
        error: errorMessage 
      });
      return [];
    }
  }

  private async updateTutorsCache(): Promise<void> {
    try {
      logger.info('Actualizando cache de tutores', 'AuthService');
      
      const response = await fetch(`${this.baseUrl}/auth/tutors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TutorsResponse = await response.json();

      if (data.status !== 'success') {
        throw new Error(`API error: ${data.message}`);
      }

      this.tutorsCache.clear();

      data.data.tutors.forEach(tutor => {
        this.tutorsCache.set(tutor.id, tutor);
      });

      this.lastCacheUpdate = Date.now();
      
      logger.info('Cache de tutores actualizado', 'AuthService', { 
        tutorCount: data.data.tutors.length 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error actualizando cache de tutores', 'AuthService', { 
        error: errorMessage 
      });
      throw error;
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpirationTime;
  }

  async forceCacheUpdate(): Promise<void> {
    this.lastCacheUpdate = 0;
    await this.updateTutorsCache();
  }
} 