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
  Edit
} from 'lucide-react';
import { StoreData } from '@/hooks/useAdminDashboard';

interface AdminStoreManagementProps {
  stores: StoreData[];
  onRefresh: () => void;
}

export const AdminStoreManagement = ({ stores, onRefresh }: AdminStoreManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStores = stores?.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.locatario_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const activeStores = stores?.filter(store => store.api_configured).length || 0;
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tienda
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tiendas por nombre, dirección o locatario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeStores} con API configurada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores?.reduce((sum, store) => sum + store.proveedores_count, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
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
                    <div>
                      <div className="font-medium">{store.locatario_name}</div>
                      {store.locatario_email && (
                        <div className="text-sm text-muted-foreground">{store.locatario_email}</div>
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
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tienda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
