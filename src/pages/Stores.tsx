import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Search, Plus, MapPin, Users, Package } from 'lucide-react';
import InvitationManagement from '@/components/InvitationManagement';
import StoreProviderManagement from '@/components/StoreProviderManagement';

const Stores = () => {
  const { profile } = useAuth();
  const { currentStore, isLocatario, isAdmin } = useStoreContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock stores data
  const mockStores = [
    {
      id: 'store-1',
      name: 'Tienda Centro',
      address: 'Av. Principal 123, Santiago',
      phone: '+56 9 1234 5678',
      email: 'centro@tienda.com',
      status: 'active',
      manager: 'Juan Pérez',
      userCount: 15,
      productCount: 250,
      createdAt: '2023-12-01T00:00:00Z',
      bsaleStoreId: 'bsale-store-1',
    },
    {
      id: 'store-2',
      name: 'Tienda Norte',
      address: 'Calle Norte 456, Las Condes',
      phone: '+56 9 8765 4321',
      email: 'norte@tienda.com',
      status: 'active',
      manager: 'María González',
      userCount: 8,
      productCount: 180,
      createdAt: '2024-01-15T00:00:00Z',
      bsaleStoreId: 'bsale-store-2',
    },
    {
      id: 'store-3',
      name: 'Tienda Sur',
      address: 'Av. Sur 789, Providencia',
      phone: '+56 9 5555 6666',
      email: 'sur@tienda.com',
      status: 'inactive',
      manager: 'Carlos Rodríguez',
      userCount: 5,
      productCount: 120,
      createdAt: '2023-11-20T00:00:00Z',
      bsaleStoreId: null,
    },
  ];

  const filteredStores = mockStores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStores = mockStores.filter(store => store.status === 'active').length;
  const inactiveStores = mockStores.filter(store => store.status === 'inactive').length;
  const totalUsers = mockStores.reduce((sum, store) => sum + store.userCount, 0);
  const totalProducts = mockStores.reduce((sum, store) => sum + store.productCount, 0);

  // Show different content based on user role
  if (!isAdmin && !isLocatario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No tienes permisos para acceder a esta sección.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Locatario view - manage their own store
  if (isLocatario && currentStore) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Tienda</h1>
            <p className="text-muted-foreground">
              Gestiona tu tienda: {currentStore.store_name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="invitations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invitations">Invitaciones</TabsTrigger>
            <TabsTrigger value="providers">Proveedores</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations">
            <InvitationManagement
              storeId={currentStore.store_id}
              storeName={currentStore.store_name}
            />
          </TabsContent>

          <TabsContent value="providers">
            <StoreProviderManagement
              storeId={currentStore.store_id}
              storeName={currentStore.store_name}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Tienda</CardTitle>
                <CardDescription>
                  Configuración y ajustes de tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Información de la Tienda</h3>
                    <p className="text-sm text-muted-foreground">
                      Nombre: {currentStore.store_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {currentStore.store_id}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Conexión Bsale</h3>
                    <p className="text-sm text-muted-foreground">
                      Configura tu conexión con Bsale para sincronizar productos y ventas
                    </p>
                    <Button className="mt-2" variant="outline">
                      Configurar Bsale
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Admin view - manage all stores
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tiendas</h1>
          <p className="text-muted-foreground">
            Gestiona las tiendas del sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tienda
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStores.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Store className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas las Tiendas</TabsTrigger>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Lista de Tiendas
              </CardTitle>
              <CardDescription>
                Todas las tiendas registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tiendas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-4">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store) => (
                    <div key={store.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{store.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {store.address}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                            {store.status === 'active' ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {store.bsaleStoreId && (
                            <Badge variant="outline">Bsale Conectada</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Gerente</p>
                          <p className="font-medium">{store.manager}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{store.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Usuarios</p>
                          <p className="font-medium">{store.userCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Productos</p>
                          <p className="font-medium">{store.productCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Creada: {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Ver Detalles
                          </Button>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron tiendas con ese término' : 'No hay tiendas registradas'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiendas Activas</CardTitle>
              <CardDescription>
                Tiendas que están operando actualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStores.filter(store => store.status === 'active').map((store) => (
                  <div key={store.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {store.address}
                        </div>
                      </div>
                      <Badge variant="default">Activa</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Gerente</p>
                        <p className="font-medium">{store.manager}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Usuarios</p>
                        <p className="font-medium">{store.userCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Productos</p>
                        <p className="font-medium">{store.productCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bsale</p>
                        <p className="font-medium">
                          {store.bsaleStoreId ? 'Conectada' : 'No conectada'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiendas Inactivas</CardTitle>
              <CardDescription>
                Tiendas que están temporalmente cerradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStores.filter(store => store.status === 'inactive').map((store) => (
                  <div key={store.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-700">{store.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {store.address}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Inactiva</Badge>
                        <Button size="sm" variant="outline">
                          Activar
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Gerente</p>
                        <p className="font-medium">{store.manager}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Usuarios</p>
                        <p className="font-medium">{store.userCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Productos</p>
                        <p className="font-medium">{store.productCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estado</p>
                        <p className="font-medium text-red-600">Cerrada</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Tiendas Activas</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(activeStores / mockStores.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{activeStores}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tiendas Inactivas</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(inactiveStores / mockStores.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{inactiveStores}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Promedio de usuarios por tienda</span>
                    <span className="font-medium">{Math.round(totalUsers / mockStores.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Promedio de productos por tienda</span>
                    <span className="font-medium">{Math.round(totalProducts / mockStores.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiendas con Bsale conectado</span>
                    <span className="font-medium">
                      {mockStores.filter(store => store.bsaleStoreId).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stores;
