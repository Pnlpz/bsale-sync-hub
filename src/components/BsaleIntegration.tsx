import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Plus, Search } from 'lucide-react';
import { 
  useBsaleProducts, 
  useSearchBsaleProducts,
  useSyncProductsFromBsale,
  useSyncSalesFromBsale,
  useCreateProductInBsale 
} from '@/hooks/useBsale';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserMarca } from '@/hooks/useMarca';

const BsaleIntegration: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Get user's marca for proveedor users
  const { data: userMarcaId } = useCurrentUserMarca();

  // Hooks
  const { data: bsaleProducts, isLoading: loadingProducts } = useBsaleProducts();
  const { data: searchResults, isLoading: searching } = useSearchBsaleProducts(searchTerm);
  const syncProducts = useSyncProductsFromBsale();
  const syncSales = useSyncSalesFromBsale();
  const createInBsale = useCreateProductInBsale();

  const handleSyncProducts = () => {
    if (profile?.store_id && profile?.proveedor_id) {
      syncProducts.mutate({
        storeId: profile.store_id,
        proveedorId: profile.proveedor_id,
      });
    }
  };

  const handleSyncSales = () => {
    if (profile?.store_id && profile?.proveedor_id) {
      syncSales.mutate({
        storeId: profile.store_id,
        proveedorId: profile.proveedor_id,
      });
    }
  };

  const handleCreateInBsale = () => {
    if (selectedProductId) {
      createInBsale.mutate(selectedProductId);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integración Bsale</h1>
        <p className="text-muted-foreground">
          Gestiona la sincronización de datos entre tu aplicación y Bsale
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="sync">Sincronización</TabsTrigger>
          <TabsTrigger value="search">Búsqueda</TabsTrigger>
          <TabsTrigger value="create">Crear</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Bsale</CardTitle>
              <CardDescription>
                Lista de productos obtenidos desde Bsale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando productos...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {bsaleProducts?.items?.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
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
                  ))}
                  {bsaleProducts?.items?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No se encontraron productos
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sincronizar Productos
                </CardTitle>
                <CardDescription>
                  Importa productos desde Bsale a tu base de datos local
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSyncProducts}
                  disabled={syncProducts.isPending || !profile?.store_id}
                  className="w-full"
                >
                  {syncProducts.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Productos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sincronizar Ventas
                </CardTitle>
                <CardDescription>
                  Importa ventas desde Bsale a tu base de datos local
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSyncSales}
                  disabled={syncSales.isPending || !profile?.store_id}
                  className="w-full"
                >
                  {syncSales.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Ventas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Buscar Productos
              </CardTitle>
              <CardDescription>
                Busca productos específicos en Bsale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Nombre del producto</Label>
                <Input
                  id="search"
                  placeholder="Ingresa el nombre del producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searching && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Buscando...</span>
                </div>
              )}

              {searchResults && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Resultados ({searchResults.count})</h3>
                  {searchResults.items.map((product) => (
                    <div key={product.id} className="p-3 border rounded">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Crear en Bsale
              </CardTitle>
              <CardDescription>
                Crea productos locales en Bsale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productId">ID del producto local</Label>
                <Input
                  id="productId"
                  placeholder="UUID del producto en tu base de datos"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleCreateInBsale}
                disabled={createInBsale.isPending || !selectedProductId}
                className="w-full"
              >
                {createInBsale.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear en Bsale
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BsaleIntegration;
