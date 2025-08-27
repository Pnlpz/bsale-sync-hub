/**
 * Store Provider Management Component
 * Manages providers in a store and their marca assignments
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Settings,
  RefreshCw,
  UserMinus,
  UserCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useStoreProviders, useAssignMarcaToProvider, useRemoveProviderFromStore, useReactivateProviderInStore } from '@/hooks/useStore';
import { useMarcas } from '@/hooks/useMarca';
import { useToast } from '@/hooks/use-toast';

interface StoreProviderManagementProps {
  storeId: string;
  storeName: string;
}

export default function StoreProviderManagement({ storeId, storeName }: StoreProviderManagementProps) {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<string>('');

  // Hooks
  const { data: storeProviders, isLoading, refetch } = useStoreProviders({ store_id: storeId });
  const { data: marcas } = useMarcas();
  const assignMarca = useAssignMarcaToProvider();
  const removeProvider = useRemoveProviderFromStore();
  const reactivateProvider = useReactivateProviderInStore();

  const handleAssignMarca = async () => {
    if (!selectedProvider || !selectedMarca) {
      toast({
        title: 'Error',
        description: 'Selecciona un proveedor y una marca',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assignMarca.mutateAsync({
        store_id: storeId,
        provider_id: selectedProvider,
        marca_id: selectedMarca,
      });

      setIsAssignDialogOpen(false);
      setSelectedProvider(null);
      setSelectedMarca('');
      refetch();
    } catch (error) {
      console.error('Error assigning marca:', error);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    try {
      await removeProvider.mutateAsync({ storeId, providerId });
      refetch();
    } catch (error) {
      console.error('Error removing provider:', error);
    }
  };

  const handleReactivateProvider = async (providerId: string) => {
    try {
      await reactivateProvider.mutateAsync({ storeId, providerId });
      refetch();
    } catch (error) {
      console.error('Error reactivating provider:', error);
    }
  };

  const openAssignDialog = (providerId: string) => {
    setSelectedProvider(providerId);
    setIsAssignDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeProviders = storeProviders?.filter(sp => sp.is_active) || [];
  const inactiveProviders = storeProviders?.filter(sp => !sp.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Active Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Proveedores Activos
              </CardTitle>
              <CardDescription>
                Proveedores con acceso activo a la tienda
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando proveedores...</p>
            </div>
          ) : !activeProviders.length ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay proveedores activos</p>
              <p className="text-sm">Los proveedores aparecerán aquí cuando acepten sus invitaciones</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Marca Asignada</TableHead>
                  <TableHead>Fecha de Ingreso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProviders.map((storeProvider) => (
                  <TableRow key={storeProvider.id}>
                    <TableCell className="font-medium">
                      {storeProvider.provider.name}
                    </TableCell>
                    <TableCell>{storeProvider.provider.email}</TableCell>
                    <TableCell>
                      {storeProvider.marca ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Tag className="h-3 w-3" />
                          {storeProvider.marca.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <AlertCircle className="h-3 w-3" />
                          Sin asignar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(storeProvider.invited_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignDialog(storeProvider.provider_id)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveProvider(storeProvider.provider_id)}
                          disabled={removeProvider.isPending}
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inactive Providers */}
      {inactiveProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Proveedores Inactivos
            </CardTitle>
            <CardDescription>
              Proveedores que han sido removidos de la tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Marca Anterior</TableHead>
                  <TableHead>Fecha de Ingreso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveProviders.map((storeProvider) => (
                  <TableRow key={storeProvider.id} className="opacity-60">
                    <TableCell className="font-medium">
                      {storeProvider.provider.name}
                    </TableCell>
                    <TableCell>{storeProvider.provider.email}</TableCell>
                    <TableCell>
                      {storeProvider.marca ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Tag className="h-3 w-3" />
                          {storeProvider.marca.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(storeProvider.invited_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivateProvider(storeProvider.provider_id)}
                        disabled={reactivateProvider.isPending}
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Assign Marca Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Marca</DialogTitle>
            <DialogDescription>
              Selecciona una marca para asignar al proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Marca</label>
              <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <AlertDescription>
                El proveedor solo podrá ver y gestionar productos de la marca asignada.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedProvider(null);
                  setSelectedMarca('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssignMarca}
                disabled={assignMarca.isPending || !selectedMarca}
              >
                {assignMarca.isPending ? 'Asignando...' : 'Asignar Marca'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
