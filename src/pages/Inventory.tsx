import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Plus, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { useBsaleProducts, useSyncProductsFromBsale } from '@/hooks/useBsale';
import { useFilteredProducts, useMarcas, useCurrentUserMarca } from '@/hooks/useMarca';
import BsaleIntegration from '@/components/BsaleIntegration';
import { StoreContextInfo } from '@/components/StoreSelector';

const Inventory = () => {
  const { profile } = useAuth();
  const { isProvider } = useStoreContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<string>('');

  // Get user's marca for proveedor users
  const { data: userMarcaId } = useCurrentUserMarca();

  // Get available marcas (for admin and locatario users)
  const { data: marcas } = useMarcas();

  // Get filtered products from Supabase based on user role, marca, and current store
  const { data: localProducts, isLoading: loadingLocalProducts } = useFilteredProducts();

  // Get Bsale products (for sync purposes)
  const { data: bsaleProducts, isLoading: loadingBsaleProducts } = useBsaleProducts();
  const syncProducts = useSyncProductsFromBsale();

  const handleSync = () => {
    if (profile?.store_id && profile?.proveedor_id) {
      syncProducts.mutate({
        storeId: profile.store_id,
        proveedorId: profile.proveedor_id,
      });
    }
  };

  // Filter Bsale products for display (used in Bsale tab)
  const filteredBsaleProducts = bsaleProducts?.items?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Determine which products to show based on current tab
  const isLoading = loadingLocalProducts || loadingBsaleProducts;

  return (
    <div className="space-y-6">
      {/* Store Context Info for Providers */}
      {isProvider && <StoreContextInfo />}

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
                {profile?.role === 'proveedor' && userMarcaId && (
                  <Badge variant="outline" className="ml-2">
                    Filtrado por marca
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Productos disponibles en tu inventario
                {profile?.role === 'proveedor' ? ' (solo tu marca)' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Marca filter for admin and locatario users */}
                {(profile?.role === 'admin' || profile?.role === 'locatario') && marcas && marcas.length > 0 && (
                  <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Todas las marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las marcas</SelectItem>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={handleSync} disabled={syncProducts.isPending}>
                  {syncProducts.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {loadingLocalProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando productos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localProducts && localProducts.length > 0 ? (
                    localProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Precio: ${product.price} | Stock: {product.stock}
                            {product.marca && ` | Marca: ${product.marca.name}`}
                          </p>
                          {product.description && (
                            <p className="text-sm mt-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                            {product.stock > 0 ? "En Stock" : "Sin Stock"}
                          </Badge>
                          {product.marca && (
                            <Badge variant="outline">
                              {product.marca.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || selectedMarca
                          ? 'No se encontraron productos con los filtros aplicados'
                          : 'No hay productos locales disponibles'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Sincroniza productos desde Bsale para comenzar
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
                <Package className="h-5 w-5 mr-2" />
                Control de Stock
              </CardTitle>
              <CardDescription>
                Monitorea los niveles de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
