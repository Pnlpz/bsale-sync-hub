/**
 * Store Selector Component
 * Allows providers to switch between stores they have access to
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store, 
  ChevronDown, 
  Building2, 
  Users, 
  Package, 
  Tag,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useAuth } from '@/hooks/useAuth';

export default function StoreSelector() {
  const { profile } = useAuth();
  const { 
    storeContext, 
    currentStore, 
    switchStore, 
    isProvider,
    hasMultipleStores 
  } = useStoreContext();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isProvider || !hasMultipleStores) {
    return null;
  }

  const handleStoreSwitch = (storeId: string) => {
    switchStore(storeId);
    setIsDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Tienda Actual</p>
                <p className="text-lg font-semibold">
                  {currentStore?.store_name || 'Ninguna seleccionada'}
                </p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Cambiar Tienda
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar Tienda</DialogTitle>
                  <DialogDescription>
                    Elige la tienda con la que quieres trabajar
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {storeContext.accessible_stores.map((storeAccess) => (
                    <Card 
                      key={storeAccess.store_id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        currentStore?.store_id === storeAccess.store_id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : ''
                      }`}
                      onClick={() => handleStoreSwitch(storeAccess.store_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <h3 className="font-semibold">{storeAccess.store_name}</h3>
                              {currentStore?.store_id === storeAccess.store_id && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Actual
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Acceso desde: {formatDate(storeAccess.invited_at)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-muted-foreground">Marca Asignada</p>
                              <p className="font-medium">
                                {storeAccess.marca_name || 'Sin asignar'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-muted-foreground">Estado</p>
                              <p className="font-medium text-green-600">Activo</p>
                            </div>
                          </div>
                        </div>

                        {storeAccess.marca_name && (
                          <div className="mt-3 pt-3 border-t">
                            <Badge variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {storeAccess.marca_name}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {currentStore && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tu Marca</p>
                  <p className="font-medium">
                    {currentStore.marca_name || 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Acceso desde</p>
                  <p className="font-medium">
                    {formatDate(currentStore.invited_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact Store Selector for Header/Navigation
 */
export function CompactStoreSelector() {
  const { 
    currentStore, 
    switchStore, 
    storeContext,
    isProvider,
    hasMultipleStores 
  } = useStoreContext();

  if (!isProvider || !hasMultipleStores) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Store className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentStore?.store_id || ''}
        onValueChange={switchStore}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Seleccionar tienda" />
        </SelectTrigger>
        <SelectContent>
          {storeContext.accessible_stores.map((storeAccess) => (
            <SelectItem key={storeAccess.store_id} value={storeAccess.store_id}>
              <div className="flex items-center justify-between w-full">
                <span>{storeAccess.store_name}</span>
                {storeAccess.marca_name && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {storeAccess.marca_name}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Store Context Info Component
 * Shows current store context information
 */
export function StoreContextInfo() {
  const { currentStore, isProvider } = useStoreContext();

  if (!isProvider || !currentStore) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Trabajando en: <strong>{currentStore.store_name}</strong>
        </span>
        {currentStore.marca_name && (
          <Badge variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {currentStore.marca_name}
          </Badge>
        )}
      </div>
    </div>
  );
}
