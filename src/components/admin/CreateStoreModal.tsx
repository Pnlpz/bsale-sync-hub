/**
 * Create Store Modal Component
 * Allows admins to create new stores, assign locatarios, and configure Bsale API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  User, 
  Mail, 
  MapPin, 
  Settings, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { useCreateStore } from '@/hooks/useCreateStore';
import { useToast } from '@/hooks/use-toast';

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
  bsaleStoreId: string;
  bsaleApiToken: string;
}

export const CreateStoreModal = ({ isOpen, onClose, onSuccess }: CreateStoreModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'store' | 'locatario' | 'api'>('store');
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    address: '',
    locatarioName: '',
    locatarioEmail: '',
    bsaleStoreId: '',
    bsaleApiToken: '',
  });

  const createStore = useCreateStore();

  const handleInputChange = (field: keyof StoreFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStoreInfo = () => {
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
        description: 'La dirección de la tienda es requerida',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateLocatarioInfo = () => {
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.locatarioEmail)) {
      toast({
        title: 'Error',
        description: 'El email del locatario no es válido',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateApiInfo = () => {
    if (!formData.bsaleStoreId.trim()) {
      toast({
        title: 'Error',
        description: 'El ID de Tienda Bsale es requerido',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.bsaleApiToken.trim()) {
      toast({
        title: 'Error',
        description: 'El Token API Bsale es requerido',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'store' && validateStoreInfo()) {
      setCurrentStep('locatario');
    } else if (currentStep === 'locatario' && validateLocatarioInfo()) {
      setCurrentStep('api');
    }
  };

  const handleBack = () => {
    if (currentStep === 'locatario') {
      setCurrentStep('store');
    } else if (currentStep === 'api') {
      setCurrentStep('locatario');
    }
  };

  const handleSubmit = async () => {
    if (!validateStoreInfo() || !validateLocatarioInfo() || !validateApiInfo()) {
      return;
    }

    try {
      await createStore.mutateAsync({
        storeData: {
          name: formData.name,
          address: formData.address,
          bsale_store_id: formData.bsaleStoreId,
          bsale_api_token: formData.bsaleApiToken,
        },
        locatarioData: {
          name: formData.locatarioName,
          email: formData.locatarioEmail,
        },
      });

      toast({
        title: '¡Tienda creada exitosamente!',
        description: `La tienda "${formData.name}" ha sido creada con API configurada y se ha enviado una invitación a ${formData.locatarioEmail}`,
      });

      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        locatarioName: '',
        locatarioEmail: '',
        bsaleStoreId: '',
        bsaleApiToken: '',
      });
      setCurrentStep('store');
      onClose();
      onSuccess();

    } catch (error: any) {
      toast({
        title: 'Error al crear tienda',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (!createStore.isPending) {
      setCurrentStep('store');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            Crear Nueva Tienda
          </DialogTitle>
          <DialogDescription>
            Configura una nueva tienda, asigna un locatario y configura la integración con Bsale
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Tienda
            </TabsTrigger>
            <TabsTrigger value="locatario" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Locatario
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              API Bsale
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Tienda</CardTitle>
                <CardDescription>
                  Ingresa los datos básicos de la nueva tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nombre de la Tienda *</Label>
                  <Input
                    id="storeName"
                    placeholder="Ej: Tienda Central Santiago"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={createStore.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Dirección *</Label>
                  <Textarea
                    id="storeAddress"
                    placeholder="Ej: Av. Providencia 1234, Providencia, Santiago"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={createStore.isPending}
                    rows={3}
                  />
                </div>
                <Alert>
                  <Store className="h-4 w-4" />
                  <AlertDescription>
                    Esta información será visible para los proveedores y se usará para identificar la tienda en el sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locatario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asignar Locatario</CardTitle>
                <CardDescription>
                  El locatario será el responsable de gestionar esta tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locatarioName">Nombre Completo *</Label>
                  <Input
                    id="locatarioName"
                    placeholder="Ej: Juan Pérez González"
                    value={formData.locatarioName}
                    onChange={(e) => handleInputChange('locatarioName', e.target.value)}
                    disabled={createStore.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locatarioEmail">Correo Electrónico *</Label>
                  <Input
                    id="locatarioEmail"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.locatarioEmail}
                    onChange={(e) => handleInputChange('locatarioEmail', e.target.value)}
                    disabled={createStore.isPending}
                  />
                </div>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Se enviará una invitación por correo electrónico al locatario para que pueda acceder al sistema y gestionar su tienda.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración API Bsale</CardTitle>
                <CardDescription>
                  Configura la integración con Bsale (REQUERIDO - Solo el admin puede configurar la API)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bsaleStoreId">ID de Tienda Bsale *</Label>
                  <Input
                    id="bsaleStoreId"
                    placeholder="Ej: 123456"
                    value={formData.bsaleStoreId}
                    onChange={(e) => handleInputChange('bsaleStoreId', e.target.value)}
                    disabled={createStore.isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén este ID desde tu panel de administración de Bsale
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bsaleApiToken">Token API Bsale *</Label>
                  <Input
                    id="bsaleApiToken"
                    type="password"
                    placeholder="Token de acceso a la API de Bsale"
                    value={formData.bsaleApiToken}
                    onChange={(e) => handleInputChange('bsaleApiToken', e.target.value)}
                    disabled={createStore.isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Token de autenticación para acceder a la API de Bsale
                  </p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IMPORTANTE:</strong> La configuración de API es obligatoria y solo puede ser realizada por el administrador.
                    El locatario NO podrá configurar estos datos desde su panel.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <div>
            {currentStep !== 'store' && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={createStore.isPending}
              >
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={createStore.isPending}
            >
              Cancelar
            </Button>
            {currentStep !== 'api' ? (
              <Button onClick={handleNext} disabled={createStore.isPending}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createStore.isPending}>
                {createStore.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Crear Tienda
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
