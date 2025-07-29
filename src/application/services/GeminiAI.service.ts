import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@shared/utils/Logger';
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
      logger.info(`Generando respuesta IA`, 'GeminiAI', { userId: request.userId });

      const conversationContext = this.buildConversationContext(
        request.conversationHistory || []
      );

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

      const fullPrompt = `
${systemPrompt}

${conversationContext}

Estudiante: ${request.userMessage}

Tutor IA:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      logger.info(`Respuesta IA generada`, 'GeminiAI', { 
        userId: request.userId,
        responseLength: responseText.length 
      });

      return {
        response: responseText.trim(),
        model: 'gemini-1.5-flash',
        tokensUsed: this.estimateTokens(fullPrompt + responseText)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generando respuesta con Gemini', 'GeminiAI', { 
        userId: request.userId, 
        error: errorMessage 
      });
      
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

    const recentHistory = history.slice(-10);
    
    const context = recentHistory.map(msg => {
      const role = msg.isFromAI() ? 'Tutor IA' : 'Estudiante';
      return `${role}: ${msg.mensaje}`;
    }).join('\n');

    return `Historial de conversación reciente:\n${context}\n`;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private getFallbackResponse(userMessage: string): string {
    const fallbackResponses = [
      "¡Hola! 👋 Soy tu asistente educativo. En este momento tengo dificultades técnicas, pero estoy aquí para ayudarte con tus estudios. ¿Podrías repetir tu pregunta?",
      
      "📚 Disculpa las molestias técnicas. Mientras tanto, te sugiero revisar los materiales de estudio y vuelve a preguntar en un momento.",
      
      "🔧 Estoy experimentando problemas técnicos temporales. Tu pregunta es importante para mí. ¿Podrías intentar nuevamente en unos minutos?",
      
      "💡 Aunque tengo dificultades técnicas ahora, recuerda que estudiar regularmente y hacer preguntas específicas te ayudará mucho. ¡Vuelve pronto!"
    ];

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Gemini AI service health check failed', 'GeminiAI', { 
        error: errorMessage 
      });
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

  /**
   * Analiza el contexto de una conversación y responde a preguntas de moderación:
   * - ¿Hay bullying en estas palabras?
   * - ¿Alguna de las partes expresa preocupación?
   * - ¿A nivel académico la conversación fluye de manera constructiva?
   */
  async analyzeConversationContext(messages: string[]): Promise<{
    bullying: boolean;
    bullying_explanation: string;
    concern: boolean;
    concern_explanation: string;
    academic_constructive: boolean;
    academic_explanation: string;
    raw: string;
  }> {
    const prompt = `Eres un moderador experto en análisis de conversaciones educativas. Analiza la siguiente conversación (cada línea es un mensaje, alternando entre dos personas):

"""
${messages.join('\n')}
"""

Responde SOLO en formato JSON estricto a las siguientes preguntas (no agregues texto antes ni después):
1. "bullying": ¿Detectas bullying, acoso o lenguaje inapropiado? (true/false)
2. "bullying_explanation": Explica brevemente por qué sí o no.
3. "concern": ¿Alguna de las partes expresa preocupación personal, emocional o de salud? (true/false)
4. "concern_explanation": Explica brevemente por qué sí o no.
5. "academic_constructive": ¿La conversación fluye de manera constructiva a nivel académico? (true/false)
6. "academic_explanation": Explica brevemente por qué sí o no.

Ejemplo de respuesta:
{
  "bullying": false,
  "bullying_explanation": "No se detecta lenguaje ofensivo ni acoso.",
  "concern": true,
  "concern_explanation": "Una de las partes expresa preocupación por su rendimiento académico.",
  "academic_constructive": true,
  "academic_explanation": "La conversación es colaborativa y se enfoca en resolver dudas académicas.",
  "raw": "(copia textual de la conversación analizada)"
}

Responde SOLO el JSON, sin explicaciones adicionales, sin texto antes ni después.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    logger.debug('Respuesta cruda de Gemini', 'GeminiAI', { responseText });

    let jsonText = responseText;
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      jsonText = match[0];
    }

    try {
      const json = JSON.parse(jsonText);
      if (!json.raw) json.raw = messages.join('\n');
      return json;
    } catch (e) {
      return {
        bullying: false,
        bullying_explanation: 'No se pudo analizar la respuesta de la IA.',
        concern: false,
        concern_explanation: 'No se pudo analizar la respuesta de la IA.',
        academic_constructive: false,
        academic_explanation: 'No se pudo analizar la respuesta de la IA.',
        raw: messages.join('\n')
      };
    }
  }
} 