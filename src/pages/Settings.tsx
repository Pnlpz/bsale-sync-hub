import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Shield, Database, RefreshCw } from 'lucide-react';
import BsaleConnectionTest from '@/components/BsaleConnectionTest';

const Settings = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    lowStock: true,
    sales: true,
    sync: false,
  });

  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: '30',
    syncProducts: true,
    syncSales: true,
    syncClients: false,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSyncSettingChange = (key: string, value: boolean | string) => {
    setSyncSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tus preferencias y configuraciones del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="bsale">Bsale</TabsTrigger>
          <TabsTrigger value="sync">Sincronización</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Perfil
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    defaultValue={profile?.name || ''}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={profile?.email || ''}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  value={
                    profile?.role === 'admin' ? 'Administrador' :
                    profile?.role === 'proveedor' ? 'Proveedor' :
                    profile?.role === 'locatario' ? 'Locatario' : 'Sin definir'
                  }
                  disabled
                />
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Canales de Notificación</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones en tu correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones en el navegador
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Tipos de Notificaciones</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Stock Bajo</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando los productos tengan poco stock
                    </p>
                  </div>
                  <Switch
                    checked={notifications.lowStock}
                    onCheckedChange={(value) => handleNotificationChange('lowStock', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones de Ventas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre nuevas ventas registradas
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sales}
                    onCheckedChange={(value) => handleNotificationChange('sales', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones de Sincronización</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre el estado de la sincronización con Bsale
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sync}
                    onCheckedChange={(value) => handleNotificationChange('sync', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Restaurar Predeterminados</Button>
                <Button>Guardar Preferencias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bsale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Configuración de Bsale
              </CardTitle>
              <CardDescription>
                Configura la integración con Bsale API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BsaleConnectionTest />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Configuraciones adicionales para la integración con Bsale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">URL de la API</Label>
                <Input
                  id="api-url"
                  defaultValue={import.meta.env.VITE_BSALE_API_URL || 'https://api.bsale.io/v1'}
                  placeholder="https://api.bsale.io/v1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-token">Token de Acceso</Label>
                <Input
                  id="access-token"
                  type="password"
                  defaultValue={import.meta.env.VITE_BSALE_ACCESS_TOKEN || ''}
                  placeholder="Tu token de acceso de Bsale"
                />
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Probar Conexión</Button>
                <Button>Guardar Configuración</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                Configuración de Sincronización
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo sincronizar datos con Bsale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincronizar datos automáticamente en intervalos regulares
                  </p>
                </div>
                <Switch
                  checked={syncSettings.autoSync}
                  onCheckedChange={(value) => handleSyncSettingChange('autoSync', value)}
                />
              </div>

              {syncSettings.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Intervalo de Sincronización (minutos)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    value={syncSettings.syncInterval}
                    onChange={(e) => handleSyncSettingChange('syncInterval', e.target.value)}
                    placeholder="30"
                    min="5"
                    max="1440"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 5 minutos, máximo 24 horas (1440 minutos)
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Datos a Sincronizar</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Productos</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar información de productos
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.syncProducts}
                    onCheckedChange={(value) => handleSyncSettingChange('syncProducts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ventas</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar documentos de venta
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.syncSales}
                    onCheckedChange={(value) => handleSyncSettingChange('syncSales', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Clientes</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar información de clientes
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.syncClients}
                    onCheckedChange={(value) => handleSyncSettingChange('syncClients', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Sincronizar Ahora</Button>
                <Button>Guardar Configuración</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Gestiona la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Cambiar Contraseña</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Tu contraseña actual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Tu nueva contraseña"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirma tu nueva contraseña"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Sesiones Activas</h4>
                <p className="text-sm text-muted-foreground">
                  Gestiona las sesiones activas en diferentes dispositivos
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sesión Actual</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome en macOS • Última actividad: Ahora
                      </p>
                    </div>
                    <Badge variant="default">Activa</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cerrar Todas las Sesiones</Button>
                <Button>Cambiar Contraseña</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
