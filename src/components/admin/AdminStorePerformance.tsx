/**
 * Admin Store Performance Component
 * Shows stores with best performance based on operational metrics
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
  Store, 
  Users, 
  Package, 
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { StoreData } from '@/hooks/useAdminDashboard';

interface AdminStorePerformanceProps {
  stores: StoreData[];
}

export const AdminStorePerformance = ({ stores }: AdminStorePerformanceProps) => {
  // Calculate performance metrics for each store
  const storesWithMetrics = (stores || []).map(store => {
    // Performance score based on:
    // - API configuration (25 points)
    // - Number of providers (25 points max, 5 points per provider up to 5)
    // - Number of products (25 points max, 1 point per 10 products up to 250)
    // - Having assigned locatario (25 points)
    
    let performanceScore = 0;
    
    // API Configuration (25 points)
    if (store.api_configured) {
      performanceScore += 25;
    }
    
    // Providers (25 points max)
    performanceScore += Math.min(store.proveedores_count * 5, 25);
    
    // Products (25 points max)
    performanceScore += Math.min(Math.floor(store.products_count / 10), 25);
    
    // Assigned locatario (25 points)
    if (store.locatario_name && store.locatario_name !== 'Sin asignar') {
      performanceScore += 25;
    }
    
    return {
      ...store,
      performanceScore,
      performanceLevel: performanceScore >= 80 ? 'Excelente' : 
                       performanceScore >= 60 ? 'Bueno' : 
                       performanceScore >= 40 ? 'Regular' : 'Necesita Atención'
    };
  });

  // Sort by performance score
  const sortedStores = storesWithMetrics.sort((a, b) => b.performanceScore - a.performanceScore);
  const topPerformers = sortedStores.slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getPerformanceBadgeVariant = (level: string) => {
    switch (level) {
      case 'Excelente': return 'default';
      case 'Bueno': return 'secondary';
      case 'Regular': return 'outline';
      case 'Necesita Atención': return 'destructive';
      default: return 'outline';
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'Excelente': return 'text-green-600';
      case 'Bueno': return 'text-blue-600';
      case 'Regular': return 'text-yellow-600';
      case 'Necesita Atención': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Rendimiento de Tiendas</h2>
        <p className="text-muted-foreground">
          Análisis del rendimiento operativo basado en configuración, proveedores y productos
        </p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiendas Excelentes</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {storesWithMetrics.filter(s => s.performanceLevel === 'Excelente').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Puntuación ≥ 80
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuración API</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {storesWithMetrics.filter(s => s.api_configured).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {storesWithMetrics.length} tiendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Proveedores</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {storesWithMetrics.length > 0 
                ? Math.round(storesWithMetrics.reduce((sum, s) => sum + s.proveedores_count, 0) / storesWithMetrics.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              proveedores por tienda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Productos</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {storesWithMetrics.length > 0 
                ? Math.round(storesWithMetrics.reduce((sum, s) => sum + s.products_count, 0) / storesWithMetrics.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              productos por tienda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tiendas con Mejor Rendimiento
          </CardTitle>
          <CardDescription>
            Top 5 tiendas basado en configuración, proveedores y productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Locatario</TableHead>
                  <TableHead>API</TableHead>
                  <TableHead>Proveedores</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Puntuación</TableHead>
                  <TableHead>Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((store, index) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500 mr-2" />}
                        {index === 1 && <Award className="h-4 w-4 text-gray-400 mr-2" />}
                        {index === 2 && <Award className="h-4 w-4 text-amber-600 mr-2" />}
                        <span className="font-medium">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                          {store.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {store.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{store.locatario_name}</div>
                        {store.locatario_email && (
                          <div className="text-sm text-muted-foreground">{store.locatario_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.api_configured ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configurada
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {store.proveedores_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {store.products_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`font-bold ${getPerformanceColor(store.performanceLevel)}`}>
                        {store.performanceScore}/100
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPerformanceBadgeVariant(store.performanceLevel)}>
                        {store.performanceLevel}
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
                No hay tiendas registradas para analizar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Criterios de Evaluación</CardTitle>
          <CardDescription>
            Cómo se calcula la puntuación de rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Factores de Puntuación:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>API Configurada: 25 puntos</span>
                </li>
                <li className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Proveedores: 5 puntos c/u (máx. 25)</span>
                </li>
                <li className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-orange-600" />
                  <span>Productos: 1 punto c/10 (máx. 25)</span>
                </li>
                <li className="flex items-center">
                  <Store className="h-4 w-4 mr-2 text-purple-600" />
                  <span>Locatario Asignado: 25 puntos</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Niveles de Rendimiento:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-green-600" />
                  <span>Excelente: 80-100 puntos</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Bueno: 60-79 puntos</span>
                </li>
                <li className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-yellow-600" />
                  <span>Regular: 40-59 puntos</span>
                </li>
                <li className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  <span>Necesita Atención: 0-39 puntos</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
