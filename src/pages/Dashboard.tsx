import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();

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
        return {
          title: 'Panel de Proveedor',
          description: 'Gestiona tus productos y ventas',
          stats: [
            { title: 'Mis Productos', value: '156', icon: Package, color: 'text-blue-600' },
            { title: 'Ventas del Mes', value: '$12,340', icon: ShoppingCart, color: 'text-green-600' },
            { title: 'Stock Bajo', value: '5', icon: AlertTriangle, color: 'text-orange-600' },
            { title: 'Tiendas Activas', value: '8', icon: TrendingUp, color: 'text-purple-600' },
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dashboardData.title}</h1>
        <p className="text-muted-foreground">{dashboardData.description}</p>
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
    </div>
  );
};

export default Dashboard;