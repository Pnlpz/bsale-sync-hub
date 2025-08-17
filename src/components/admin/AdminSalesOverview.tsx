/**
 * Admin Sales Overview Component
 * Displays sales analytics and charts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  TrendingUp, 
  Store, 
  DollarSign, 
  ShoppingCart,
  Award,
  BarChart3
} from 'lucide-react';
import { SalesOverviewData } from '@/hooks/useAdminDashboard';

interface AdminSalesOverviewProps {
  data: SalesOverviewData;
}

export const AdminSalesOverview = ({ data }: AdminSalesOverviewProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
            <CardDescription>Cargando datos de ventas...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Resumen de Ventas</h2>
        <p className="text-muted-foreground">
          Análisis general del rendimiento de ventas del sistema
        </p>
      </div>

      {/* Sales Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Ventas Diarias
          </CardTitle>
          <CardDescription>
            Evolución de las ventas en los últimos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Gráfico de ventas diarias
              </p>
              <p className="text-sm text-muted-foreground">
                (Implementación pendiente)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Stores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Tiendas con Mejor Rendimiento
          </CardTitle>
          <CardDescription>
            Top 5 tiendas por ingresos generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.top_stores && data.top_stores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_stores.map((store, index) => (
                  <TableRow key={store.store_name}>
                    <TableCell>
                      <div className="flex items-center">
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500 mr-2" />}
                        {index === 1 && <Award className="h-4 w-4 text-gray-400 mr-2" />}
                        {index === 2 && <Award className="h-4 w-4 text-amber-600 mr-2" />}
                        <span className="font-medium">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{store.store_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                        {store.sales}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                        {formatCurrency(store.revenue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={index < 3 ? "default" : "secondary"}
                        className={
                          index === 0 ? "bg-yellow-100 text-yellow-800" :
                          index === 1 ? "bg-gray-100 text-gray-800" :
                          index === 2 ? "bg-amber-100 text-amber-800" : ""
                        }
                      >
                        {index < 3 ? "Top Performer" : "Buen Rendimiento"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No hay datos de ventas disponibles
              </p>
              <p className="text-sm text-muted-foreground">
                Las tiendas aparecerán aquí una vez que tengan ventas registradas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio de Ventas por Tienda</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.top_stores && data.top_stores.length > 0 
                ? Math.round(data.top_stores.reduce((sum, store) => sum + store.sales, 0) / data.top_stores.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              ventas por tienda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.top_stores && data.top_stores.length > 0 
                ? formatCurrency(data.top_stores.reduce((sum, store) => sum + store.revenue, 0) / data.top_stores.length)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              por tienda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.top_stores ? data.top_stores.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              con ventas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Productos Más Vendidos
          </CardTitle>
          <CardDescription>
            Los productos con mejor rendimiento en ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Análisis de productos más vendidos (Próximamente)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
