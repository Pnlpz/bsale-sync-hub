import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useBsaleProducts, useSyncProductsFromBsale } from '@/hooks/useBsale';
import BsaleIntegration from '@/components/BsaleIntegration';

const Inventory = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: bsaleProducts, isLoading } = useBsaleProducts();
  const syncProducts = useSyncProductsFromBsale();

  const handleSync = () => {
    if (profile?.store_id && profile?.proveedor_id) {
      syncProducts.mutate({
        storeId: profile.store_id,
        proveedorId: profile.proveedor_id,
      });
    }
  };

  const filteredProducts = bsaleProducts?.items?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Gestiona tus productos y stock
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSync} disabled={syncProducts.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {syncProducts.isPending ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="bsale">Integración Bsale</TabsTrigger>
          <TabsTrigger value="stock">Control de Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Lista de Productos
              </CardTitle>
              <CardDescription>
                Productos disponibles en tu inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando productos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {product.id} | Clasificación: {product.classification}
                          </p>
                          {product.description && (
                            <p className="text-sm mt-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={product.state === 0 ? "default" : "secondary"}>
                            {product.state === 0 ? "Activo" : "Inactivo"}
                          </Badge>
                          <Badge variant={product.stockControl ? "default" : "outline"}>
                            {product.stockControl ? "Con Stock" : "Sin Stock"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron productos con ese término' : 'No hay productos disponibles'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bsale">
          <BsaleIntegration />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Control de Stock
              </CardTitle>
              <CardDescription>
                Monitorea los niveles de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Funcionalidad de control de stock en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
