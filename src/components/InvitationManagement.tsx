/**
 * Invitation Management Component
 * Allows locatarios to invite providers and manage invitations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Plus, 
  RefreshCw, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  Users,
  Calendar
} from 'lucide-react';
import { useInvitations, useCreateInvitation, useCancelInvitation, useResendInvitation, useInvitationStats } from '@/hooks/useInvitation';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useToast } from '@/hooks/use-toast';
import { EmailService } from '@/services/email-service';
import { InvitationStatus } from '@/types/invitation';

interface InvitationManagementProps {
  storeId: string;
  storeName: string;
}

export default function InvitationManagement({ storeId, storeName }: InvitationManagementProps) {
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'proveedor' as const,
  });

  // Hooks
  const { data: invitations, isLoading, refetch } = useInvitations({ store_id: storeId });
  const { data: stats } = useInvitationStats(storeId);
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!EmailService.isValidEmail(inviteForm.email)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un correo electrónico válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invitation = await createInvitation.mutateAsync({
        email: inviteForm.email,
        store_id: storeId,
        role: inviteForm.role,
        expires_in_hours: 72,
      });

      // Send invitation email
      const invitationUrl = EmailService.generateInvitationUrl(invitation.token);
      await EmailService.sendInvitationEmail({
        to: invitation.email,
        store_name: storeName,
        inviter_name: 'Locatario', // This should come from current user
        invitation_url: invitationUrl,
        role: invitation.role,
        expires_at: invitation.expires_at,
      });

      setInviteForm({ email: '', role: 'proveedor' });
      setIsInviteDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync(invitationId);
      refetch();
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const invitation = await resendInvitation.mutateAsync(invitationId);
      
      // Send new invitation email
      const invitationUrl = EmailService.generateInvitationUrl(invitation.token);
      await EmailService.sendInvitationEmail({
        to: invitation.email,
        store_name: storeName,
        inviter_name: 'Locatario',
        invitation_url: invitationUrl,
        role: invitation.role,
        expires_at: invitation.expires_at,
      });

      refetch();
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pendiente' },
      accepted: { variant: 'default' as const, icon: CheckCircle, text: 'Aceptada' },
      expired: { variant: 'destructive' as const, icon: XCircle, text: 'Expirada' },
      cancelled: { variant: 'outline' as const, icon: X, text: 'Cancelada' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Aceptadas</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Expiradas</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Canceladas</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invitaciones
              </CardTitle>
              <CardDescription>
                Gestiona las invitaciones enviadas a proveedores
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Invitar Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Proveedor</DialogTitle>
                    <DialogDescription>
                      Envía una invitación por correo electrónico a un nuevo proveedor
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="proveedor@ejemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rol</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as 'proveedor' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proveedor">Proveedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert>
                      <AlertDescription>
                        Se enviará un correo con un enlace de invitación que expira en 72 horas.
                      </AlertDescription>
                    </Alert>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createInvitation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {createInvitation.isPending ? 'Enviando...' : 'Enviar Invitación'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando invitaciones...</p>
            </div>
          ) : !invitations?.length ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay invitaciones enviadas</p>
              <p className="text-sm">Invita a tu primer proveedor para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell className="capitalize">{invitation.role}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>{formatDate(invitation.created_at)}</TableCell>
                    <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={resendInvitation.isPending}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={cancelInvitation.isPending}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
