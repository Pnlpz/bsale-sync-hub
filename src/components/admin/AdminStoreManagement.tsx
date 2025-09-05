/**
 * Admin Store Management Component
 * Manages stores, locatario assignments, and API configurations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ShoppingCart,
  DollarSign,
  Search,
  Settings,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  AlertCircle,
  User
} from 'lucide-react';
import { StoreData } from '@/hooks/useAdminDashboard';
import { CreateStoreModal } from './CreateStoreModal';

interface AdminStoreManagementProps {
  stores: StoreData[];
  onRefresh: () => void;
}

export const AdminStoreManagement = ({ stores, onRefresh }: AdminStoreManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'no-locatario'>('all');

  const filteredStores = stores?.filter(store => {
    // Text search filter
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.locatario_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = (() => {
      switch (statusFilter) {
        case 'active':
          return store.api_configured;
        case 'pending':
          return !store.api_configured;
        case 'no-locatario':
          return store.locatario_name === 'Sin asignar';
        case 'all':
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus;
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  // Calculate store statistics
  const totalStores = stores?.length || 0;
  const activeStores = stores?.filter(store => store.api_configured).length || 0;
  const pendingStores = stores?.filter(store => !store.api_configured).length || 0;
  const storesWithLocatario = stores?.filter(store => store.locatario_name !== 'Sin asignar').length || 0;
  const pendingLocatarioStores = stores?.filter(store => store.locatario_name === 'Sin asignar').length || 0;

  const totalRevenue = stores?.reduce((sum, store) => sum + store.total_revenue, 0) || 0;
  const totalSales = stores?.reduce((sum, store) => sum + store.total_sales, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Tiendas</h2>
          <p className="text-muted-foreground">
            Administra tiendas, asignaciones de locatarios y configuraciones API
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onRefresh} variant="outline">
            Actualizar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tienda
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tiendas por nombre, dirección o locatario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por estado:</span>
          <div className="flex space-x-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todas ({totalStores})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
              className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Activas ({activeStores})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className={statusFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Pendientes API ({pendingStores})
            </Button>
            <Button
              variant={statusFilter === 'no-locatario' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('no-locatario')}
              className={statusFilter === 'no-locatario' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <User className="h-3 w-3 mr-1" />
              Sin Locatario ({pendingLocatarioStores})
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores}</div>
            <p className="text-xs text-muted-foreground">
              Tiendas creadas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStores}</div>
            <p className="text-xs text-muted-foreground">
              Con API Bsale configurada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes API</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingStores}</div>
            <p className="text-xs text-muted-foreground">
              Sin configuración de API
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locatarios Asignados</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{storesWithLocatario}</div>
            <p className="text-xs text-muted-foreground">
              {pendingLocatarioStores} sin asignar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores?.reduce((sum, store) => sum + store.proveedores_count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Transacciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue generado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tiendas</CardTitle>
          <CardDescription>
            Información detallada de cada tienda y su configuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tienda</TableHead>
                <TableHead>Locatario</TableHead>
                <TableHead>API Status</TableHead>
                <TableHead>Proveedores</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center">
                        <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                        {store.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {store.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {store.locatario_name === 'Sin asignar' ? (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                          <div>
                            <div className="font-medium text-orange-600">Sin asignar</div>
                            <div className="text-xs text-muted-foreground">Pendiente de locatario</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-green-500 mr-2" />
                          <div>
                            <div className="font-medium">{store.locatario_name}</div>
                            {store.locatario_email && (
                              <div className="text-sm text-muted-foreground">{store.locatario_email}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {store.api_configured ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configurada
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sin configurar
                        </Badge>
                      )}
                      {store.bsale_store_id && (
                        <div className="text-xs text-muted-foreground">
                          ID: {store.bsale_store_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {store.proveedores_count} proveedores
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {store.products_count} productos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                      {store.total_sales}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(store.total_revenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(store.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStores.length === 0 && (
            <div className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron tiendas que coincidan con la búsqueda.' : 'No hay tiendas registradas.'}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tienda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
};
