import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatHistory } from '@domain/entities/ChatHistory.entity';

export interface GeminiRequest {
  userMessage: string;
  userId: string;
  conversationHistory?: ChatHistory[];
}

export interface GeminiResponse {
  response: string;
  tokensUsed?: number;
  model: string;
}

export class GeminiAIService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  async generateResponse(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      console.log(`🤖 Generando respuesta IA para usuario: ${request.userId}`);

      // Construir contexto de conversación
      const conversationContext = this.buildConversationContext(
        request.conversationHistory || []
      );

      // Prompt del sistema para tutorías
      const systemPrompt = `
Eres un asistente de IA especializado en educación y tutorías. Tu objetivo es:

1. Ayudar a estudiantes con preguntas académicas
2. Proporcionar explicaciones claras y didácticas
3. Sugerir métodos de estudio efectivos
4. Dar ejemplos prácticos cuando sea apropiado
5. Hacer preguntas para entender mejor las necesidades del estudiante

Características de tus respuestas:
- Amigable y motivador
- Explicaciones paso a paso
- Uso de emojis ocasionales para hacer el contenido más atractivo
- Respuestas concisas pero completas
- Siempre en español

Si no entiendes algo, pide aclaraciones.
Si la pregunta no es académica, redirige amablemente hacia temas educativos.
      `.trim();

      // Combinar contexto y mensaje actual
      const fullPrompt = `
${systemPrompt}

${conversationContext}

Estudiante: ${request.userMessage}

Tutor IA:`;

      // Generar respuesta
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      console.log(`✅ Respuesta IA generada: ${responseText.substring(0, 100)}...`);

      return {
        response: responseText.trim(),
        model: 'gemini-1.5-flash',
        tokensUsed: this.estimateTokens(fullPrompt + responseText)
      };

    } catch (error) {
      console.error('❌ Error generando respuesta con Gemini:', error);
      
      // Respuesta de fallback
      return {
        response: this.getFallbackResponse(request.userMessage),
        model: 'fallback',
        tokensUsed: 0
      };
    }
  }

  private buildConversationContext(history: ChatHistory[]): string {
    if (history.length === 0) {
      return '';
    }

    // Tomar los últimos 10 mensajes para contexto
    const recentHistory = history.slice(-10);
    
    const context = recentHistory.map(msg => {
      const role = msg.isFromAI() ? 'Tutor IA' : 'Estudiante';
      return `${role}: ${msg.mensaje}`;
    }).join('\n');

    return `Historial de conversación reciente:\n${context}\n`;
  }

  private estimateTokens(text: string): number {
    // Estimación aproximada: 1 token ≈ 4 caracteres
    return Math.ceil(text.length / 4);
  }

  private getFallbackResponse(userMessage: string): string {
    const fallbackResponses = [
      "¡Hola! 👋 Soy tu asistente educativo. En este momento tengo dificultades técnicas, pero estoy aquí para ayudarte con tus estudios. ¿Podrías repetir tu pregunta?",
      
      "📚 Disculpa las molestias técnicas. Mientras tanto, te sugiero revisar los materiales de estudio y vuelve a preguntar en un momento.",
      
      "🔧 Estoy experimentando problemas técnicos temporales. Tu pregunta es importante para mí. ¿Podrías intentar nuevamente en unos minutos?",
      
      "💡 Aunque tengo dificultades técnicas ahora, recuerda que estudiar regularmente y hacer preguntas específicas te ayudará mucho. ¡Vuelve pronto!"
    ];

    // Seleccionar respuesta basada en el contenido del mensaje
    if (userMessage.toLowerCase().includes('hola') || userMessage.toLowerCase().includes('saludo')) {
      return fallbackResponses[0];
    } else if (userMessage.toLowerCase().includes('tarea') || userMessage.toLowerCase().includes('estudio')) {
      return fallbackResponses[1];
    } else {
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  async isServiceHealthy(): Promise<boolean> {
    try {
      const testResponse = await this.model.generateContent("Responde solo con 'OK' si funcionas correctamente.");
      const response = await testResponse.response;
      const text = response.text().trim().toUpperCase();
      
      return text.includes('OK');
    } catch (error) {
      console.error('❌ Gemini AI service health check failed:', error);
      return false;
    }
  }

  getModelInfo(): { model: string; provider: string; version: string } {
    return {
      model: 'gemini-1.5-flash',
      provider: 'Google',
      version: '1.5'
    };
  }
} 