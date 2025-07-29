import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bell, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

const Alerts = () => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // Mock alerts data
  const mockAlerts = [
    {
      id: 1,
      type: 'low_stock',
      title: 'Stock Bajo - Producto A',
      message: 'El producto A tiene solo 5 unidades en stock',
      severity: 'critical',
      isRead: false,
      createdAt: '2024-01-15T10:30:00Z',
      productId: 'prod-1',
    },
    {
      id: 2,
      type: 'sync_error',
      title: 'Error de Sincronización',
      message: 'No se pudo sincronizar con Bsale. Verificar conexión.',
      severity: 'warning',
      isRead: false,
      createdAt: '2024-01-15T09:15:00Z',
    },
    {
      id: 3,
      type: 'sale_notification',
      title: 'Nueva Venta Registrada',
      message: 'Se registró una venta de $150.00',
      severity: 'info',
      isRead: true,
      createdAt: '2024-01-15T08:45:00Z',
    },
    {
      id: 4,
      type: 'low_stock',
      title: 'Stock Bajo - Producto B',
      message: 'El producto B tiene solo 2 unidades en stock',
      severity: 'critical',
      isRead: false,
      createdAt: '2024-01-14T16:20:00Z',
      productId: 'prod-2',
    },
    {
      id: 5,
      type: 'system',
      title: 'Actualización Completada',
      message: 'La sincronización automática se completó exitosamente',
      severity: 'success',
      isRead: true,
      createdAt: '2024-01-14T14:00:00Z',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'info': return <Bell className="h-5 w-5" />;
      case 'success': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const filteredAlerts = mockAlerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'critical') return alert.severity === 'critical';
    return true;
  });

  const unreadCount = mockAlerts.filter(alert => !alert.isRead).length;
  const criticalCount = mockAlerts.filter(alert => alert.severity === 'critical').length;

  const markAsRead = (alertId: number) => {
    // In a real app, this would update the alert in the database
    console.log(`Marking alert ${alertId} as read`);
  };

  const markAllAsRead = () => {
    // In a real app, this would update all alerts in the database
    console.log('Marking all alerts as read');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-muted-foreground">
            Notificaciones y alertas del sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar Todo como Leído
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Leídas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilter('all')}>
            Todas ({mockAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="unread" onClick={() => setFilter('unread')}>
            No Leídas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="critical" onClick={() => setFilter('critical')}>
            Críticas ({criticalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Lista de Alertas
              </CardTitle>
              <CardDescription>
                Todas las notificaciones y alertas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)} ${
                        !alert.isRead ? 'border-l-4' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                          {!alert.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(alert.id)}
                            >
                              Marcar como Leída
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay alertas para mostrar
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas No Leídas</CardTitle>
              <CardDescription>
                Alertas que requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)} border-l-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Marcar como Leída
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      ¡Excelente! No tienes alertas sin leer
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Alertas Críticas</CardTitle>
              <CardDescription>
                Alertas que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border border-red-200 bg-red-50 rounded-lg border-l-4 border-l-red-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-800">{alert.title}</h3>
                            <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                            <p className="text-xs text-red-600 mt-2">
                              {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">Crítica</Badge>
                          {!alert.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(alert.id)}
                            >
                              Marcar como Leída
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay alertas críticas en este momento
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;
