/**
 * Email testing helpers for console debugging
 */

// Check Resend configuration
export const checkEmailConfig = () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  const fromEmail = import.meta.env.VITE_FROM_EMAIL;

  console.log('🔧 Resend Configuration:');
  console.log('API Key configured:', apiKey ? '✅ Yes' : '❌ No');
  console.log('From Email:', fromEmail || 'Using default');
  
  if (!apiKey) {
    console.log('⚠️ To configure Resend:');
    console.log('1. Get API key from https://resend.com');
    console.log('2. Add VITE_RESEND_API_KEY=your_key to .env.local');
    console.log('3. Restart the development server');
  }

  return { apiKey: !!apiKey, fromEmail };
};

// Test email sending using Supabase Edge Function
export const testEmailSending = async (testEmail: string) => {
  try {
    console.log('🧪 Testing email sending to:', testEmail);

    const { supabase } = await import('@/integrations/supabase/client');
    const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'onboarding@resend.dev';

    const testEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
              <h1 style="color: #2563eb;">🧪 Test Email - Bsale Sync Hub</h1>
              <p>Este es un email de prueba para verificar la configuración de Resend.</p>
              <p><strong>Configuración:</strong></p>
              <ul>
                  <li>Edge Function: Funcionando ✅</li>
                  <li>From Email: ${fromEmail}</li>
                  <li>Fecha: ${new Date().toLocaleString()}</li>
              </ul>
              <p>Si recibes este email, ¡la configuración está funcionando correctamente!</p>
          </div>
      </body>
      </html>
    `;

    // Call Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: testEmail,
        subject: '🧪 Test Email - Bsale Sync Hub',
        html: testEmailContent,
        from: fromEmail,
      },
    });

    if (error) {
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!result?.success) {
      throw new Error(`Email sending failed: ${result?.error || 'Unknown error'}`);
    }

    console.log('✅ Test email sent successfully:', {
      id: result.data?.id,
      to: testEmail,
    });

    // Show success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test email enviado', {
        body: `Email de prueba enviado a ${testEmail}`,
        icon: '/favicon.ico',
      });
    }

    return result;

  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};

// Check recent invitations
export const checkInvitationStatus = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check recent invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error checking invitations:', error);
      return;
    }

    console.log('📊 Recent invitations status:');
    console.table(invitations?.map(inv => ({
      email: inv.email,
      status: inv.status,
      created: new Date(inv.created_at).toLocaleString(),
      expires: new Date(inv.expires_at).toLocaleString(),
    })));

    return invitations;

  } catch (error) {
    console.error('Error checking invitation status:', error);
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).checkEmailConfig = checkEmailConfig;
  (window as any).testEmailSending = testEmailSending;
  (window as any).checkInvitationStatus = checkInvitationStatus;
  
  // Also create a convenient object
  (window as any).EmailTest = {
    checkConfig: checkEmailConfig,
    sendTest: testEmailSending,
    checkInvitations: checkInvitationStatus,
  };
}
