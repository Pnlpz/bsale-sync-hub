/**
 * Admin Proveedores List Component
 * Displays detailed information about all proveedores
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
  Eye,
  Settings,
  Calendar,
  Package
} from 'lucide-react';
import { ProveedorData } from '@/hooks/useAdminDashboard';

interface AdminProveedoresListProps {
  proveedores: ProveedorData[];
  onRefresh: () => void;
}

export const AdminProveedoresList = ({ proveedores, onRefresh }: AdminProveedoresListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProveedores = proveedores?.filter(proveedor =>
    proveedor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.stores.some(store => store.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proveedores</h2>
          <p className="text-muted-foreground">
            Gestiona y monitorea todos los proveedores del sistema
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedores por nombre, email o tienda..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proveedores?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proveedores?.reduce((sum, p) => sum + p.products_count, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proveedores?.reduce((sum, p) => sum + p.total_sales, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(proveedores?.reduce((sum, p) => sum + p.total_revenue, 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proveedores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Información detallada de cada proveedor y su rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Tiendas</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{proveedor.name}</div>
                      <div className="text-sm text-muted-foreground">{proveedor.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary">
                        {proveedor.stores_count} tiendas
                      </Badge>
                      {proveedor.stores.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {proveedor.stores.slice(0, 2).join(', ')}
                          {proveedor.stores.length > 2 && ` +${proveedor.stores.length - 2} más`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Package className="h-3 w-3 mr-1" />
                      {proveedor.products_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                      {proveedor.total_sales}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(proveedor.total_revenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(proveedor.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
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

          {filteredProveedores.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron proveedores que coincidan con la búsqueda.' : 'No hay proveedores registrados.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
