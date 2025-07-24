import { Resend } from 'resend';
import { AuthService } from './AuthService';

export interface EmailAlertData {
  senderId: string;
  recipientId: string;
  message: string;
  conversationId?: string;
  isToAI: boolean;
  analysis?: {
    bullying: boolean;
    bullying_explanation: string;
    concern: boolean;
    concern_explanation: string;
    academic_constructive: boolean;
    academic_explanation: string;
  };
}

export class EmailService {
  private resend: Resend;
  private authService: AuthService;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }
    this.resend = new Resend(apiKey);
    this.authService = new AuthService();
  }

  async sendMessageAlert(data: EmailAlertData): Promise<void> {
    try {
      let recipientEmail: string;

      if (data.isToAI) {
        // Para mensajes a IA, siempre enviar al líder
        recipientEmail = 'Alanenmexico12@gmail.com';
      } else {
        // Para mensajes privados, obtener el email real del destinatario
        const tutorEmail = await this.authService.getTutorEmail(data.recipientId);
        if (tutorEmail) {
          recipientEmail = tutorEmail;
        } else {
          console.warn(`⚠️ No se pudo obtener email para tutor ${data.recipientId}, usando email por defecto`);
          recipientEmail = `${data.recipientId}@gmail.com`; // Fallback
        }
      }

      const subject = data.isToAI 
        ? '🚨 Alerta: Mensaje enviado a IA' 
        : '💬 Nuevo mensaje privado recibido';

      const htmlContent = this.generateAlertEmailHTML(data);

      await this.resend.emails.send({
        from: 'Chat Service <noreply@rutasegura.xyz>',
        to: [recipientEmail],
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Email de alerta enviado a: ${recipientEmail}`);

    } catch (error) {
      console.error('❌ Error enviando email de alerta:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  private generateAlertEmailHTML(data: EmailAlertData): string {
    const timestamp = new Date().toLocaleString('es-MX');
    const messageType = data.isToAI ? 'IA' : 'usuario';
    const recipientType = data.isToAI ? 'IA del sistema' : `usuario ${data.recipientId}`;

    let analysisSection = '';
    if (data.analysis) {
      analysisSection = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #495057; margin-top: 0;">📊 Análisis de IA del Mensaje</h3>
          
          <div style="margin: 10px 0;">
            <strong>🚫 Bullying detectado:</strong> 
            <span style="color: ${data.analysis.bullying ? '#dc3545' : '#28a745'}">
              ${data.analysis.bullying ? 'SÍ' : 'NO'}
            </span>
            <br>
            <small style="color: #6c757d;">${data.analysis.bullying_explanation}</small>
          </div>

          <div style="margin: 10px 0;">
            <strong>😰 Preocupación expresada:</strong> 
            <span style="color: ${data.analysis.concern ? '#ffc107' : '#28a745'}">
              ${data.analysis.concern ? 'SÍ' : 'NO'}
            </span>
            <br>
            <small style="color: #6c757d;">${data.analysis.concern_explanation}</small>
          </div>

          <div style="margin: 10px 0;">
            <strong>📚 Flujo académico constructivo:</strong> 
            <span style="color: ${data.analysis.academic_constructive ? '#28a745' : '#dc3545'}">
              ${data.analysis.academic_constructive ? 'SÍ' : 'NO'}
            </span>
            <br>
            <small style="color: #6c757d;">${data.analysis.academic_explanation}</small>
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Mensaje</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">🚨 Alerta de Mensaje</h1>
          <p style="margin: 10px 0 0 0;">Sistema de Monitoreo de Chat</p>
        </div>

        <div style="background-color: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #495057; margin-top: 0;">📨 Detalles del Mensaje</h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <p><strong>👤 Remitente:</strong> ${data.senderId}</p>
              <p><strong>📬 Destinatario:</strong> ${recipientType}</p>
              <p><strong>💬 Mensaje:</strong></p>
              <div style="background-color: white; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0;">
                "${data.message}"
              </div>
              <p><strong>🕒 Fecha y hora:</strong> ${timestamp}</p>
              ${data.conversationId ? `<p><strong>🆔 ID Conversación:</strong> ${data.conversationId}</p>` : ''}
            </div>
          </div>

          ${analysisSection}

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #495057; margin-top: 0;">ℹ️ Información del Sistema</h3>
            <p style="margin: 5px 0; font-size: 14px;">
              • Este es un mensaje automático del sistema de monitoreo<br>
              • El análisis de IA se realiza en tiempo real<br>
              • Para más información, contacta al administrador del sistema
            </p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>© 2024 Sistema de Chat Educativo. Todos los derechos reservados.</p>
        </div>

      </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Resend no tiene un método de verificación directo, pero podemos intentar enviar un email de prueba
      await this.resend.emails.send({
        from: 'Chat Service <noreply@rutasegura.xyz>',
        to: ['test@example.com'],
        subject: 'Test Connection',
        html: '<p>Test email</p>'
      });
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión de email:', error);
      return false;
    }
  }

  /**
   * Método para testing - obtener información de tutores
   */
  async getTutorsInfo(): Promise<any[]> {
    try {
      return await this.authService.getAllTutors();
    } catch (error) {
      console.error('❌ Error obteniendo información de tutores:', error);
      return [];
    }
  }
} 