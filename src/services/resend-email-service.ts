/**
 * Resend Email Service
 * Real email sending using Resend API
 */

import { InvitationEmailData } from '@/types/invitation';

// Email template optimized for Resend
const RESEND_INVITATION_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a Bsale Sync Hub</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
                Bsale Sync Hub
            </div>
            <h1 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0;">
                ¡Has sido invitado a unirte!
            </h1>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p><strong>{{inviter_name}}</strong> te ha invitado a unirte como <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 500;">{{role}}</span> en:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{store_name}}</h3>
                <p style="margin: 0; color: #64748b;">Tendrás acceso a gestionar productos, ventas y sincronización con Bsale.</p>
            </div>
            
            <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitation_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Aceptar Invitación
            </a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
                <strong>⏰ Importante:</strong> Esta invitación expira el {{expires_at}}
            </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
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

export class ResendEmailService {
  private static readonly RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  private static readonly FROM_EMAIL = 'noreply@bsale-sync-hub.com'; // Cambiar por tu dominio

  /**
   * Send invitation email using Resend API
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    try {
      // Check if Resend is configured
      if (!this.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      // Format expiry date
      const expiryDate = new Date(data.expires_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Replace template variables
      const emailContent = RESEND_INVITATION_TEMPLATE
        .replace(/{{inviter_name}}/g, data.inviter_name)
        .replace(/{{store_name}}/g, data.store_name)
        .replace(/{{role}}/g, this.getRoleDisplayName(data.role))
        .replace(/{{invitation_url}}/g, data.invitation_url)
        .replace(/{{expires_at}}/g, expiryDate);

      // Send email via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.FROM_EMAIL,
          to: [data.to],
          subject: `Invitación a ${data.store_name} - Bsale Sync Hub`,
          html: emailContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Email sent successfully via Resend:', {
        id: result.id,
        to: data.to,
      });

    } catch (error) {
      console.error('❌ Resend email sending failed:', error);
      throw error;
    }
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
   * Send test email to verify configuration
   */
  static async sendTestEmail(to: string): Promise<void> {
    try {
      const testData: InvitationEmailData = {
        to,
        inviter_name: 'Sistema de Prueba',
        store_name: 'Tienda de Prueba',
        role: 'locatario',
        invitation_url: 'https://ejemplo.com/test',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.sendInvitationEmail(testData);
      console.log('✅ Test email sent successfully');

    } catch (error) {
      console.error('❌ Test email failed:', error);
      throw error;
    }
  }
}

// Export for easy testing in console
(window as any).ResendEmailService = ResendEmailService;
