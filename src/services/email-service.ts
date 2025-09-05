/**
 * Email Service - Clean Version
 * Handles email notifications for invitations and system events
 */

import { InvitationEmailData } from '@/types/invitation';

// Email template
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
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .store-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .role-badge {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 500;
            display: inline-block;
        }
        .cta-button {
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            display: inline-block;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Bsale Sync Hub</div>
            <h1 class="title">¡Has sido invitado a unirte!</h1>
        </div>
        
        <div class="content">
            <p><strong>{{inviter_name}}</strong> te ha invitado a unirte como <span class="role-badge">{{role}}</span> en:</p>
            
            <div class="store-info">
                <div class="store-name">{{store_name}}</div>
                <p>Tendrás acceso a gestionar productos, ventas y sincronización con Bsale.</p>
            </div>
            
            <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitation_url}}" class="cta-button">Aceptar Invitación</a>
        </div>
        
        <div class="warning">
            <strong>⏰ Importante:</strong> Esta invitación expira el {{expires_at}}
        </div>
        
        <div class="footer">
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px; margin: 10px 0;">
                {{invitation_url}}
            </p>
            <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
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

      // For development, use enhanced fallback with detailed instructions
      console.log('📧 Email content for manual sending:', {
        to: data.to,
        subject: `Invitación a ${data.store_name} - Bsale Sync Hub`,
        content: emailContent,
      });

      // Show fallback notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Email preparado (envío manual requerido)', {
          body: `Revisa la consola para enviar manualmente a ${data.to}`,
          icon: '/favicon.ico',
        });
      }

      console.log('📋 Manual email sending required. Check console for email content.');

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
   * Get role display name in Spanish
   */
  private static getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'locatario': 'Locatario',
      'proveedor': 'Proveedor',
      'admin': 'Administrador',
    };
    return roleNames[role] || role;
  }

  /**
   * Check email configuration
   */
  static checkEmailConfig(): void {
    console.log('🔧 Email Configuration:');
    console.log('Mode: Manual fallback (development)');
    console.log('Template: HTML ready for manual sending');
    console.log('Status: ✅ Ready for manual email sending');
  }

  /**
   * Test email preparation
   */
  static async testEmailPreparation(testEmail: string): Promise<void> {
    try {
      console.log('🧪 Testing email preparation for:', testEmail);

      const testData: InvitationEmailData = {
        to: testEmail,
        inviter_name: 'Sistema de Prueba',
        store_name: 'Tienda de Prueba',
        role: 'locatario',
        invitation_url: `${window.location.origin}/auth/register?token=test-token-123`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.sendInvitationEmail(testData);
      console.log('✅ Test email content prepared. Check console for HTML content.');

    } catch (error) {
      console.error('❌ Test email preparation failed:', error);
    }
  }
}

// Make EmailService available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).EmailService = EmailService;
}
