/**
 * Admin Dashboard
 * Comprehensive overview of all locatarios, their sales, and proveedores
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Store, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  ShoppingCart,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboard';
import { AdminLocatariosList } from '@/components/admin/AdminLocatariosList';
import { AdminProveedoresList } from '@/components/admin/AdminProveedoresList';
import { AdminStoreManagement } from '@/components/admin/AdminStoreManagement';
import { AdminStorePerformance } from '@/components/admin/AdminStorePerformance';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    refetch 
  } = useAdminDashboardData();

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No tienes permisos para acceder al panel de administración.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Error al cargar los datos del panel de administración.
            </p>
            <Button onClick={() => refetch()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona locatarios, proveedores y monitorea el rendimiento del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <UserCheck className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locatarios</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocatarios || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tiendas registradas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProveedores || 0}</div>
            <p className="text-xs text-muted-foreground">
              Proveedores activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.stores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tiendas configuradas y operativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores">
            <Settings className="h-4 w-4 mr-2" />
            Tiendas
          </TabsTrigger>
          <TabsTrigger value="locatarios">
            <Store className="h-4 w-4 mr-2" />
            Locatarios
          </TabsTrigger>
          <TabsTrigger value="proveedores">
            <Users className="h-4 w-4 mr-2" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rendimiento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          <AdminStoreManagement
            stores={dashboardData?.stores}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="locatarios" className="space-y-4">
          <AdminLocatariosList
            locatarios={dashboardData?.locatarios}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="proveedores" className="space-y-4">
          <AdminProveedoresList
            proveedores={dashboardData?.proveedores}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <AdminStorePerformance stores={dashboardData?.stores} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
