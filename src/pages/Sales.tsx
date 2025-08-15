import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Search, Plus, TrendingUp, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { useBsaleDocuments, useSyncSalesFromBsale } from '@/hooks/useBsale';
import { StoreContextInfo } from '@/components/StoreSelector';

const Sales = () => {
  const { profile } = useAuth();
  const { currentStoreId, currentStore, isProvider } = useStoreContext();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bsaleDocuments, isLoading } = useBsaleDocuments();
  const syncSales = useSyncSalesFromBsale();

  const handleSyncSales = () => {
    // Use current store context if available, otherwise fall back to profile store_id
    const storeId = currentStoreId || profile?.store_id;
    const proveedorId = profile?.id; // Use profile ID as provider ID

    console.log('Sales sync initiated:', { storeId, proveedorId, profile });

    if (storeId && proveedorId) {
      syncSales.mutate({
        storeId,
        proveedorId,
      });
    } else {
      console.error('Missing store ID or provider ID for sales sync', {
        storeId,
        proveedorId,
        currentStoreId,
        profileStoreId: profile?.store_id,
        profile
      });
    }
  };

  // Mock data for demonstration
  const salesStats = [
    { title: 'Ventas Hoy', value: '$2,340', icon: DollarSign, color: 'text-green-600' },
    { title: 'Ventas del Mes', value: '$45,231', icon: TrendingUp, color: 'text-blue-600' },
    { title: 'Transacciones', value: '156', icon: ShoppingCart, color: 'text-purple-600' },
    { title: 'Promedio Diario', value: '$1,508', icon: Calendar, color: 'text-orange-600' },
  ];

  const mockSales = [
    { id: 1, product: 'Producto A', quantity: 2, amount: 150.00, date: '2024-01-15', customer: 'Cliente 1' },
    { id: 2, product: 'Producto B', quantity: 1, amount: 75.50, date: '2024-01-15', customer: 'Cliente 2' },
    { id: 3, product: 'Producto C', quantity: 3, amount: 225.00, date: '2024-01-14', customer: 'Cliente 3' },
    { id: 4, product: 'Producto D', quantity: 1, amount: 89.99, date: '2024-01-14', customer: 'Cliente 4' },
  ];

  const filteredSales = mockSales.filter(sale =>
    sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Store Context Info for Providers */}
      {isProvider && <StoreContextInfo />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea tus ventas
            {currentStore && ` - ${currentStore.store_name}`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSyncSales}
            disabled={syncSales.isPending || (!currentStoreId && !profile?.store_id)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {syncSales.isPending ? 'Sincronizando...' : 'Sincronizar Ventas'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {salesStats.map((stat, index) => {
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

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Ventas Recientes</TabsTrigger>
          <TabsTrigger value="bsale">Documentos Bsale</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ventas Recientes
              </CardTitle>
              <CardDescription>
                Últimas transacciones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-4">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{sale.product}</h3>
                        <p className="text-sm text-muted-foreground">
                          Cliente: {sale.customer} | Cantidad: {sale.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">{sale.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${sale.amount.toFixed(2)}</p>
                        <Badge variant="outline">Completada</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron ventas con ese término' : 'No hay ventas registradas'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bsale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos de Bsale</CardTitle>
              <CardDescription>
                Documentos sincronizados desde Bsale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando documentos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bsaleDocuments?.items?.length > 0 ? (
                    bsaleDocuments.items.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">Documento #{doc.number}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {doc.id} | Fecha: {new Date(doc.emissionDate * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${doc.totalAmount}</p>
                          <Badge variant={doc.state === 0 ? "default" : "secondary"}>
                            {doc.state === 0 ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay documentos disponibles</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Reportes de Ventas
              </CardTitle>
              <CardDescription>
                Análisis y reportes de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Funcionalidad de reportes en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sales;
