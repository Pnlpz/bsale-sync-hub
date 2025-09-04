/**
 * Simple Create Store Modal Component - Fixed Version
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Loader2, AlertTriangle } from 'lucide-react';
import { useCreateStore } from '@/hooks/useCreateStore';
import { useToast } from '@/hooks/use-toast';
import { DatabaseSetupInstructions } from './DatabaseSetupInstructions';

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StoreFormData {
  name: string;
  address: string;
  locatarioName: string;
  locatarioEmail: string;
  bsaleApiToken: string;
}

export const CreateStoreModal = ({ isOpen, onClose, onSuccess }: CreateStoreModalProps) => {
  const { toast } = useToast();
  const [showDatabaseInstructions, setShowDatabaseInstructions] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    address: '',
    locatarioName: '',
    locatarioEmail: '',
    bsaleApiToken: '',
  });

  const createStore = useCreateStore();

  const handleInputChange = (field: keyof StoreFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la tienda es requerido',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.address.trim()) {
      toast({
        title: 'Error',
        description: 'La dirección es requerida',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.locatarioName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del locatario es requerido',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.locatarioEmail.trim()) {
      toast({
        title: 'Error',
        description: 'El email del locatario es requerido',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.bsaleApiToken.trim()) {
      toast({
        title: 'Error',
        description: 'El token de API de Bsale es requerido',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createStore.mutateAsync({
        storeData: {
          name: formData.name,
          address: formData.address,
          bsale_api_token: formData.bsaleApiToken,
        },
        locatarioData: {
          name: formData.locatarioName,
          email: formData.locatarioEmail,
        },
      });

      toast({
        title: '¡Tienda creada exitosamente!',
        description: `La tienda "${formData.name}" ha sido creada y se ha enviado una invitación por correo a ${formData.locatarioEmail}`,
      });

      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        locatarioName: '',
        locatarioEmail: '',
        bsaleApiToken: '',
      });
      onClose();
      onSuccess();

    } catch (error: any) {
      // Check if it's a database configuration error
      if (error.message?.includes('foreign key constraint') || 
          error.message?.includes('not-null constraint') ||
          error.message?.includes('configuración de base de datos')) {
        setShowDatabaseInstructions(true);
      }
      
      toast({
        title: 'Error al crear tienda',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (!createStore.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            {showDatabaseInstructions ? 'Configuración Requerida' : 'Crear Nueva Tienda'}
          </DialogTitle>
          <DialogDescription>
            {showDatabaseInstructions 
              ? 'Se requiere configurar la base de datos antes de crear tiendas'
              : 'Configura una nueva tienda, asigna un locatario y configura la integración con Bsale'
            }
          </DialogDescription>
        </DialogHeader>

        {showDatabaseInstructions ? (
          <div className="space-y-4">
            <DatabaseSetupInstructions />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDatabaseInstructions(false)}
              >
                Volver al Formulario
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Store Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de la Tienda</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Nombre de la Tienda</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Tienda Central Santiago"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ej: Av. Providencia 1234, Santiago"
                  />
                </div>
              </div>
            </div>

            {/* Locatario Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información del Locatario</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="locatarioName">Nombre del Locatario</Label>
                  <Input
                    id="locatarioName"
                    value={formData.locatarioName}
                    onChange={(e) => handleInputChange('locatarioName', e.target.value)}
                    placeholder="Ej: Juan Pérez González"
                  />
                </div>
                <div>
                  <Label htmlFor="locatarioEmail">Email del Locatario</Label>
                  <Input
                    id="locatarioEmail"
                    type="email"
                    value={formData.locatarioEmail}
                    onChange={(e) => handleInputChange('locatarioEmail', e.target.value)}
                    placeholder="Ej: juan@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración API Bsale</h3>
              <div>
                <Label htmlFor="bsaleApiToken">Token de API Bsale</Label>
                <Input
                  id="bsaleApiToken"
                  type="password"
                  value={formData.bsaleApiToken}
                  onChange={(e) => handleInputChange('bsaleApiToken', e.target.value)}
                  placeholder="Ingresa el token de API de Bsale"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createStore.isPending}>
                {createStore.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Tienda'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
