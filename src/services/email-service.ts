/**
 * Email Service
 * Handles email notifications for invitations and system events
 */

import { InvitationEmailData } from '@/types/invitation';

// Email templates
const INVITATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a Bsale Sync Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .store-info {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .role-badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔄 Bsale Sync Hub</div>
            <h1 class="title">¡Has sido invitado a unirte!</h1>
        </div>
        
        <div class="content">
            <p>Hola,</p>
            
            <p><strong>{{inviter_name}}</strong> te ha invitado a unirte como <span class="role-badge">{{role}}</span> en:</p>
            
            <div class="store-info">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{store_name}}</h3>
                <p style="margin: 0; color: #6b7280;">Tendrás acceso a gestionar productos, ventas y sincronización con Bsale.</p>
            </div>
            
            <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
                <a href="{{invitation_url}}" class="cta-button">Aceptar Invitación</a>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ Importante:</strong> Esta invitación expira el {{expires_at}}. Asegúrate de aceptarla antes de esa fecha.
            </div>
            
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #2563eb;">{{invitation_url}}</p>
            
            <p>Si no esperabas esta invitación, puedes ignorar este correo de forma segura.</p>
        </div>
        
        <div class="footer">
            <p>Este correo fue enviado desde Bsale Sync Hub</p>
            <p>Sistema de gestión y sincronización para tiendas Bsale</p>
        </div>
    </div>
</body>
</html>
`;

export class EmailService {
  private static readonly BASE_URL = window.location.origin;

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    try {
      // Format expiry date
      const expiryDate = new Date(data.expires_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Replace template variables
      const emailContent = INVITATION_EMAIL_TEMPLATE
        .replace(/{{inviter_name}}/g, data.inviter_name)
        .replace(/{{store_name}}/g, data.store_name)
        .replace(/{{role}}/g, this.getRoleDisplayName(data.role))
        .replace(/{{invitation_url}}/g, data.invitation_url)
        .replace(/{{expires_at}}/g, expiryDate);

      // In a real implementation, you would integrate with an email service like:
      // - Supabase Edge Functions with Resend
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // etc.

      // For now, we'll use a mock implementation that logs the email
      // and shows a browser notification (for development/demo purposes)
      
      console.log('📧 Sending invitation email:', {
        to: data.to,
        subject: `Invitación a ${data.store_name} - Bsale Sync Hub`,
        content: emailContent,
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In development, show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Email enviado', {
          body: `Invitación enviada a ${data.to}`,
          icon: '/favicon.ico',
        });
      }

      // TODO: Replace with actual email service integration
      // Example with Supabase Edge Function:
      /*
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          to: data.to,
          subject: `Invitación a ${data.store_name} - Bsale Sync Hub`,
          html: emailContent,
        },
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      */

    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error('No se pudo enviar el correo de invitación');
    }
  }

  /**
   * Generate invitation URL
   */
  static generateInvitationUrl(token: string): string {
    return `${this.BASE_URL}/invitation/accept?token=${encodeURIComponent(token)}`;
  }

  /**
   * Send welcome email after invitation acceptance
   */
  static async sendWelcomeEmail(email: string, storeName: string, role: string): Promise<void> {
    try {
      const welcomeContent = `
        <h2>¡Bienvenido a ${storeName}!</h2>
        <p>Tu cuenta ha sido creada exitosamente como ${this.getRoleDisplayName(role)}.</p>
        <p>Ya puedes acceder al sistema y comenzar a gestionar productos y ventas.</p>
        <a href="${this.BASE_URL}/login">Iniciar Sesión</a>
      `;

      console.log('📧 Sending welcome email:', {
        to: email,
        subject: `¡Bienvenido a ${storeName}!`,
        content: welcomeContent,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email failures
    }
  }

  /**
   * Send invitation reminder email
   */
  static async sendInvitationReminder(data: InvitationEmailData): Promise<void> {
    try {
      const reminderData = {
        ...data,
        subject: `Recordatorio: Invitación a ${data.store_name}`,
      };

      // Add reminder text to the template
      const reminderContent = INVITATION_EMAIL_TEMPLATE
        .replace('¡Has sido invitado a unirte!', '🔔 Recordatorio: ¡Has sido invitado a unirte!')
        .replace('te ha invitado a unirte', 'te había invitado a unirte')
        .replace('Para aceptar esta invitación', 'Aún tienes tiempo para aceptar esta invitación');

      console.log('📧 Sending invitation reminder:', {
        to: data.to,
        subject: reminderData.subject,
        content: reminderContent,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Failed to send invitation reminder:', error);
      throw new Error('No se pudo enviar el recordatorio de invitación');
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Get display name for user role
   */
  private static getRoleDisplayName(role: string): string {
    const roleNames = {
      proveedor: 'Proveedor',
      locatario: 'Locatario',
      admin: 'Administrador',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  }

  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send system notification email
   */
  static async sendSystemNotification(
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    try {
      console.log('📧 Sending system notification:', {
        to: email,
        subject,
        message,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Failed to send system notification:', error);
      // Don't throw error for system notifications
    }
  }
}
