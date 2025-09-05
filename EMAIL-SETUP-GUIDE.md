# 📧 Guía de Configuración de Email Real

## 🎯 Estado Actual

**El sistema funciona correctamente con fallback manual.** Los correos no se envían automáticamente debido a restricciones de Supabase Auth, pero el contenido se genera correctamente para envío manual.

## 🔍 Verificación del Sistema Actual

### 1. Crear Tienda y Verificar Logs
```javascript
// En la consola del navegador después de crear una tienda:
EmailService.checkEmailStatus()
```

### 2. Buscar en Consola
Después de crear una tienda, busca estos mensajes:
```
⚠️ Real email sending failed, using fallback: Error: Supabase invitation failed: User not allowed
📧 Email content for manual sending: {
  to: "usuario@ejemplo.com",
  subject: "Invitación a Tienda Test - Bsale Sync Hub",
  content: "<!DOCTYPE html>..."
}
```

### 3. Envío Manual Temporal
1. Copia el HTML del campo `content`
2. Envía por Gmail/Outlook al email del locatario
3. El locatario puede usar el enlace de invitación

## 🚀 Configuración de Email Real (Producción)

### Opción 1: Resend (Recomendado)

#### Paso 1: Crear cuenta en Resend
1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu dominio o usa el dominio de prueba

#### Paso 2: Obtener API Key
1. Ve a API Keys en el dashboard
2. Crea una nueva API key
3. Copia la key (empieza con `re_`)

#### Paso 3: Configurar Variables de Entorno
```bash
# En tu archivo .env.local
RESEND_API_KEY=re_tu_api_key_aqui
```

#### Paso 4: Usar ResendEmailService
```javascript
// Reemplazar en useCreateStore.ts
import { ResendEmailService } from '@/services/resend-email-service';

// En lugar de EmailService.sendInvitationEmail
await ResendEmailService.sendInvitationEmail({
  to: data.locatarioData.email,
  inviter_name: adminName,
  store_name: data.storeData.name,
  role: 'locatario',
  invitation_url: `${window.location.origin}/auth/register?token=${invitationToken}`,
  expires_at: expiresAt.toISOString(),
});
```

#### Paso 5: Probar
```javascript
// En consola del navegador:
ResendEmailService.sendTestEmail('tu-email@ejemplo.com')
```

### Opción 2: SendGrid

#### Configuración
```bash
npm install @sendgrid/mail
```

```javascript
// sendgrid-email-service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export class SendGridEmailService {
  static async sendInvitationEmail(data: InvitationEmailData) {
    const msg = {
      to: data.to,
      from: 'noreply@tu-dominio.com',
      subject: `Invitación a ${data.store_name}`,
      html: emailContent,
    };
    
    await sgMail.send(msg);
  }
}
```

### Opción 3: Supabase Edge Functions + Resend

#### Crear Edge Function
```bash
supabase functions new send-invitation-email
```

```typescript
// supabase/functions/send-invitation-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  const { data, error } = await resend.emails.send({
    from: 'noreply@tu-dominio.com',
    to: [to],
    subject,
    html,
  })

  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## 🧪 Testing

### Probar Sistema Actual (Fallback)
```javascript
// 1. Crear tienda con tu email
// 2. Verificar logs en consola
// 3. Copiar HTML y enviar manualmente
// 4. Probar enlace de invitación
```

### Probar con Resend
```javascript
// En consola del navegador:
ResendEmailService.sendTestEmail('tu-email@ejemplo.com')
```

### Verificar Entrega
```javascript
// Verificar estado de invitaciones
EmailService.checkEmailStatus()
```

## 📋 Checklist de Implementación

### Para Desarrollo (Actual)
- [x] Sistema de fallback funcionando
- [x] Contenido HTML generado correctamente
- [x] Logs detallados para debugging
- [x] Envío manual posible

### Para Producción
- [ ] Configurar servicio de email (Resend/SendGrid)
- [ ] Obtener API keys
- [ ] Configurar variables de entorno
- [ ] Verificar dominio de envío
- [ ] Probar envío automático
- [ ] Configurar templates personalizados
- [ ] Implementar tracking de emails

## 🎯 Recomendación

**Para desarrollo:** Continúa usando el sistema actual con envío manual.

**Para producción:** Implementa Resend (más fácil) o SendGrid (más features).

## 🔧 Solución Rápida

Si necesitas envío automático YA:

1. Crea cuenta en Resend (5 minutos)
2. Obtén API key gratuita
3. Agrega `RESEND_API_KEY` a tu .env
4. Reemplaza `EmailService` por `ResendEmailService`
5. ¡Listo! Emails automáticos funcionando

## 📞 Soporte

Si necesitas ayuda con la configuración:
1. Revisa los logs en consola
2. Verifica las API keys
3. Confirma que el dominio esté verificado
4. Prueba con emails de diferentes proveedores
