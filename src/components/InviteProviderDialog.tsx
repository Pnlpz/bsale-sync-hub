/**
 * Invite Provider Dialog Component
 * Compact dialog for locatarios to quickly invite providers from the dashboard
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Mail, Send, Loader2 } from 'lucide-react';
import { useCreateInvitation } from '@/hooks/useInvitation';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useAuth } from '@/hooks/useAuth';
import { EmailService } from '@/services/email-service';
import { supabase } from '@/integrations/supabase/client';
import { MigrationChecker } from '@/utils/migration-checker';
import { useToast } from '@/hooks/use-toast';

interface InviteProviderDialogProps {
  trigger?: React.ReactNode;
  onInviteSent?: () => void;
}

export default function InviteProviderDialog({ trigger, onInviteSent }: InviteProviderDialogProps) {
  const { profile } = useAuth();
  const { currentStore, currentStoreId } = useStoreContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayStoreName, setDisplayStoreName] = useState<string>('');

  const createInvitation = useCreateInvitation();

  // Initialize display store name
  useEffect(() => {
    const initialStoreName = currentStore?.store_name ||
                           (profile?.name ? `Tienda de ${profile.name}` : 'Tu tienda');
    setDisplayStoreName(initialStoreName);
  }, [currentStore, profile]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un correo electrónico',
        variant: 'destructive',
      });
      return;
    }

    if (!EmailService.isValidEmail(email)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un correo electrónico válido',
        variant: 'destructive',
      });
      return;
    }

    // Debug: Log available data
    console.log('Invitation Debug:', {
      currentStoreId,
      currentStore,
      profile,
      profileStoreId: profile?.store_id
    });

    // Get locatario's store using the new database function
    let storeId = currentStoreId;
    let storeName = currentStore?.store_name || 'Tu tienda';

    // If no store ID found, try to get locatario's store using migration-aware method
    if (!storeId) {
      console.log('No store ID found, trying to fetch locatario store...');

      try {
        const storeResult = await MigrationChecker.getUserStore();

        if (storeResult.success && storeResult.store) {
          storeId = storeResult.store.store_id;
          storeName = storeResult.store.store_name || storeResult.store.name || 'Tu tienda';
          setDisplayStoreName(storeName);
          console.log(`Store found via ${storeResult.method}:`, storeResult.store);
        } else {
          console.error('No store found for user:', storeResult.error);

          // Try simple direct query as last resort
          console.log('Trying direct profile query as last resort...');
          try {
            const { data: directProfile, error: directError } = await supabase
              .from('profiles')
              .select('store_id')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
              .single();

            if (!directError && directProfile?.store_id) {
              // Get store details
              const { data: storeDetails } = await supabase
                .from('stores')
                .select('id, name')
                .eq('id', directProfile.store_id)
                .single();

              if (storeDetails) {
                storeId = storeDetails.id;
                storeName = storeDetails.name;
                setDisplayStoreName(storeName);
                console.log('Store found via direct query:', storeDetails);
              } else {
                throw new Error('Store details not found');
              }
            } else {
              throw new Error('No store_id in profile');
            }
          } catch (directError) {
            console.error('Direct query also failed:', directError);

            // Check migration status for better error message
            try {
              const migrationStatus = await MigrationChecker.checkMigrationStatus();
              console.log('Migration status:', migrationStatus);

              let errorTitle = 'Sin tienda asignada';
              let errorDescription = 'No tienes una tienda asignada. Contacta al administrador.';

              if (migrationStatus.currentStructure === 'old') {
                errorTitle = 'Sistema en actualización';
                errorDescription = 'El sistema está siendo actualizado. Contacta al administrador para aplicar las actualizaciones necesarias.';
              } else if (migrationStatus.currentStructure === 'mixed') {
                errorTitle = 'Configuración incompleta';
                errorDescription = 'La configuración del sistema está incompleta. Contacta al administrador para completar la migración.';
              }

              toast({
                title: errorTitle,
                description: errorDescription,
                variant: 'destructive',
              });
            } catch (statusError) {
              console.error('Migration status check failed:', statusError);
              toast({
                title: 'Error del sistema',
                description: 'No se pudo verificar el estado del sistema. Contacta al administrador.',
                variant: 'destructive',
              });
            }
            return;
          }
        }

      } catch (error: any) {
        console.error('Error fetching locatario store:', error);
        toast({
          title: 'Error',
          description: 'No se pudo obtener la información de tu tienda. Por favor intenta nuevamente.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Ensure we have both storeId and storeName at this point
    if (!storeId) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar tu tienda. Contacta al administrador.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create invitation
      const invitation = await createInvitation.mutateAsync({
        email: email.toLowerCase(),
        store_id: storeId,
        role: 'proveedor',
        expires_in_hours: 72,
      });

      // Send invitation email
      const invitationUrl = EmailService.generateInvitationUrl(invitation.token);

      // Log invitation URL for testing (remove in production)
      console.log('🔗 Invitation URL:', invitationUrl);

      await EmailService.sendInvitationEmail({
        to: invitation.email,
        store_name: storeName,
        inviter_name: profile?.name || 'Locatario',
        invitation_url: invitationUrl,
        role: invitation.role,
        expires_at: invitation.expires_at,
      });

      toast({
        title: '¡Invitación enviada exitosamente!',
        description: `Se ha enviado una invitación a ${email}. El proveedor recibirá un correo con las instrucciones para crear su cuenta.`,
      });

      // Reset form and close dialog
      setEmail('');
      setIsOpen(false);
      onInviteSent?.();

    } catch (error: any) {
      console.error('Error sending invitation:', error);

      // Handle specific error cases
      let errorMessage = 'Ocurrió un error inesperado';
      if (error.message?.includes('already invited') || error.message?.includes('already exists')) {
        errorMessage = 'Este correo ya tiene una invitación pendiente o ya está registrado';
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'El correo electrónico no es válido';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error al enviar invitación',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Invitar Proveedor
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Invitar Proveedor
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico a un proveedor para que se una a tu tienda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico del proveedor</Label>
            <Input
              id="email"
              type="email"
              placeholder="proveedor@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              El proveedor recibirá un correo con un enlace para crear su cuenta y acceder a tu tienda.
              La invitación expira en 72 horas.
            </AlertDescription>
          </Alert>

          {displayStoreName && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tienda:</strong> {displayStoreName}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                El proveedor tendrá acceso a esta tienda una vez que acepte la invitación.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact version for use in cards or smaller spaces
 */
export function CompactInviteButton({ onInviteSent }: { onInviteSent?: () => void }) {
  return (
    <InviteProviderDialog
      trigger={
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          Invitar
        </Button>
      }
      onInviteSent={onInviteSent}
    />
  );
}

/**
 * Icon-only version for use in toolbars
 */
export function IconInviteButton({ onInviteSent }: { onInviteSent?: () => void }) {
  return (
    <InviteProviderDialog
      trigger={
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <UserPlus className="h-4 w-4" />
        </Button>
      }
      onInviteSent={onInviteSent}
    />
  );
}
