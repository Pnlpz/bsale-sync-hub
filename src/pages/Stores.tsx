/**
 * Stores Page - Admin Store Management
 * Only accessible by administrators for managing all stores
 */

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStoreManagement } from '@/components/admin/AdminStoreManagement';
import { useAdminDashboardData } from '@/hooks/useAdminDashboard';

const Stores = () => {
  const { profile } = useAuth();
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    refetch 
  } = useAdminDashboardData();

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No tienes permisos para acceder a la gestión de tiendas.
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
          <p>Cargando tiendas...</p>
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
              Error al cargar las tiendas.
            </p>
            <Button onClick={() => refetch()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminStoreManagement 
      stores={dashboardData?.stores || []}
      onRefresh={refetch}
    />
  );
};

export default Stores;
