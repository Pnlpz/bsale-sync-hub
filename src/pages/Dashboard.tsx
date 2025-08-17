import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, UserPlus, Users } from 'lucide-react';
import BsaleConnectionTest from '@/components/BsaleConnectionTest';
import StoreSelector, { StoreContextInfo } from '@/components/StoreSelector';
import InviteProviderDialog, { CompactInviteButton } from '@/components/InviteProviderDialog';
import { useFilteredProducts, useCurrentUserMarca, useMarca } from '@/hooks/useMarca';

const Dashboard = () => {
  const { profile } = useAuth();
  const { currentStore, isProvider, hasMultipleStores, isLocatario } = useStoreContext();

  // Get user's marca for proveedor users
  const { data: userMarcaId } = useCurrentUserMarca();
  const { data: userMarca } = useMarca(userMarcaId || '');

  // Get filtered products based on user role and current store
  const { data: products } = useFilteredProducts();

  const getDashboardContent = () => {
    switch (profile?.role) {
      case 'admin':
        return {
          title: 'Panel de Administración',
          description: 'Vista general del sistema completo',
          stats: [
            { title: 'Total Productos', value: '1,234', icon: Package, color: 'text-blue-600' },
            { title: 'Ventas del Mes', value: '$45,231', icon: ShoppingCart, color: 'text-green-600' },
            { title: 'Alertas Activas', value: '12', icon: AlertTriangle, color: 'text-orange-600' },
            { title: 'Crecimiento', value: '+12%', icon: TrendingUp, color: 'text-purple-600' },
          ]
        };
      case 'proveedor':
        const productCount = products?.length || 0;
        const lowStockCount = products?.filter(p => p.stock < 10).length || 0;
        const storeCount = hasMultipleStores ? 'Múltiples' : '1';
        const currentMarca = currentStore?.marca_name || 'Sin asignar';

        return {
          title: 'Panel de Proveedor',
          description: `Gestiona tus productos y ventas${currentStore ? ` - ${currentStore.store_name}` : ''}`,
          stats: [
            { title: 'Mis Productos', value: productCount.toString(), icon: Package, color: 'text-blue-600' },
            { title: 'Ventas del Mes', value: '$12,340', icon: ShoppingCart, color: 'text-green-600' },
            { title: 'Stock Bajo', value: lowStockCount.toString(), icon: AlertTriangle, color: 'text-orange-600' },
            { title: 'Tiendas Activas', value: storeCount, icon: TrendingUp, color: 'text-purple-600' },
          ]
        };
      case 'locatario':
        return {
          title: 'Panel de Tienda',
          description: 'Administra tu tienda y productos',
          stats: [
            { title: 'Productos en Tienda', value: '89', icon: Package, color: 'text-blue-600' },
            { title: 'Ventas Hoy', value: '$1,890', icon: ShoppingCart, color: 'text-green-600' },
            { title: 'Alertas', value: '3', icon: AlertTriangle, color: 'text-orange-600' },
            { title: 'Proveedores', value: '4', icon: TrendingUp, color: 'text-purple-600' },
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Bienvenido al sistema',
          stats: []
        };
    }
  };

  const dashboardData = getDashboardContent();

  return (
    <div className="space-y-6">
      {/* Store Selector for Providers with Multiple Stores */}
      {isProvider && hasMultipleStores && <StoreSelector />}

      {/* Store Context Info for Providers */}
      {isProvider && <StoreContextInfo />}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{dashboardData.title}</h1>
            {profile?.role === 'proveedor' && currentStore?.marca_name && (
              <Badge variant="outline" className="text-sm">
                {currentStore.marca_name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{dashboardData.description}</p>
        </div>

        {/* Invite Provider Button for Locatarios */}
        {(isLocatario || profile?.role === 'locatario') && (
          <InviteProviderDialog />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions for Locatarios */}
      {(isLocatario || profile?.role === 'locatario') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Proveedores
            </CardTitle>
            <CardDescription>
              Invita y gestiona los proveedores de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Invitar nuevo proveedor</p>
                <p className="text-xs text-muted-foreground">
                  Envía una invitación por correo electrónico para que un proveedor se una a tu tienda
                </p>
              </div>
              <div className="flex gap-2">
                <CompactInviteButton />
                <Button size="sm" variant="outline" asChild>
                  <a href="/stores">Ver Todos</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>
              Últimas transacciones registradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Producto {item}</p>
                    <p className="text-xs text-muted-foreground">Hace {item} horas</p>
                  </div>
                  <div className="text-sm font-medium">${(item * 123).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
            <CardDescription>
              Productos con stock bajo que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Producto {item}</p>
                    <p className="text-xs text-muted-foreground">Stock: {item} unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bsale Integration Test */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Integración Bsale</h2>
        <BsaleConnectionTest />
      </div>
    </div>
  );
};

export default Dashboard;