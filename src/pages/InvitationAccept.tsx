/**
 * Invitation Accept Page
 * Handles invitation acceptance and account creation
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, Store, User } from 'lucide-react';
import { useValidateInvitation, useAcceptInvitation } from '@/hooks/useInvitation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Validate invitation token
  const { data: validation, isLoading: isValidating, error: validationError } = useValidateInvitation(token || '');
  const acceptInvitation = useAcceptInvitation();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation?.valid || !validation.invitation) {
      toast({
        title: 'Error',
        description: 'Invitación inválida',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validation.invitation.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            invitation_token: token,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: validation.invitation.email,
          role: validation.invitation.role,
          is_invitation_only: true,
        });

      if (profileError) {
        throw profileError;
      }

      // Accept the invitation
      await acceptInvitation.mutateAsync(token!);

      toast({
        title: '¡Cuenta creada exitosamente!',
        description: 'Tu cuenta ha sido creada y la invitación ha sido aceptada',
      });

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error al crear cuenta',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitación Inválida</CardTitle>
            <CardDescription>
              {validation?.error || 'Esta invitación no es válida o ha expirado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
              variant="outline"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = validation.invitation!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>¡Has sido invitado!</CardTitle>
          <CardDescription>
            Crea tu cuenta para unirte a la tienda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{invitation.store.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700">{invitation.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 capitalize">{invitation.role}</span>
            </div>
            <div className="text-sm text-blue-600">
              Invitado por: <strong>{invitation.inviter.name}</strong>
            </div>
          </div>

          {/* Account Creation Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirma tu contraseña"
              />
            </div>

            <Alert>
              <AlertDescription>
                Al crear tu cuenta, aceptarás la invitación y tendrás acceso a la tienda <strong>{invitation.store.name}</strong>.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta y aceptar invitación'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
