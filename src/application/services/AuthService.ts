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
  private readonly cacheExpirationTime = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene el email real de un tutor por su ID
   */
  async getTutorEmail(tutorId: string): Promise<string | null> {
    try {
      // Verificar cache primero
      if (this.isCacheValid()) {
        const cachedTutor = this.tutorsCache.get(tutorId);
        if (cachedTutor) {
          console.log(`📧 Email encontrado en cache para tutor ${tutorId}: ${cachedTutor.correo}`);
          return cachedTutor.correo;
        }
      }

      // Si no está en cache o expiró, actualizar cache
      await this.updateTutorsCache();

      // Buscar en cache actualizado
      const tutor = this.tutorsCache.get(tutorId);
      if (tutor) {
        console.log(`📧 Email obtenido de API para tutor ${tutorId}: ${tutor.correo}`);
        return tutor.correo;
      }

      console.warn(`⚠️ Tutor no encontrado: ${tutorId}`);
      return null;

    } catch (error) {
      console.error('❌ Error obteniendo email del tutor:', error);
      return null;
    }
  }

  /**
   * Obtiene información completa de un tutor por su ID
   */
  async getTutorInfo(tutorId: string): Promise<Tutor | null> {
    try {
      if (this.isCacheValid()) {
        return this.tutorsCache.get(tutorId) || null;
      }

      await this.updateTutorsCache();
      return this.tutorsCache.get(tutorId) || null;

    } catch (error) {
      console.error('❌ Error obteniendo información del tutor:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los tutores (útil para debugging)
   */
  async getAllTutors(): Promise<Tutor[]> {
    try {
      if (!this.isCacheValid()) {
        await this.updateTutorsCache();
      }

      return Array.from(this.tutorsCache.values());

    } catch (error) {
      console.error('❌ Error obteniendo todos los tutores:', error);
      return [];
    }
  }

  /**
   * Actualiza el cache de tutores desde la API
   */
  private async updateTutorsCache(): Promise<void> {
    try {
      console.log('🔄 Actualizando cache de tutores...');
      
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

      // Limpiar cache anterior
      this.tutorsCache.clear();

      // Llenar cache con nuevos datos
      data.data.tutors.forEach(tutor => {
        this.tutorsCache.set(tutor.id, tutor);
      });

      this.lastCacheUpdate = Date.now();
      
      console.log(`✅ Cache de tutores actualizado: ${data.data.tutors.length} tutores`);

    } catch (error) {
      console.error('❌ Error actualizando cache de tutores:', error);
      throw error;
    }
  }

  /**
   * Verifica si el cache es válido (no ha expirado)
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpirationTime;
  }

  /**
   * Fuerza la actualización del cache (útil para testing)
   */
  async forceCacheUpdate(): Promise<void> {
    this.lastCacheUpdate = 0; // Invalida el cache
    await this.updateTutorsCache();
  }
} 