/**
 * Admin Locatarios List Component
 * Displays detailed information about all locatarios
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
  Calendar
} from 'lucide-react';
import { LocatarioData } from '@/hooks/useAdminDashboard';

interface AdminLocatariosListProps {
  locatarios: LocatarioData[];
  onRefresh: () => void;
}

export const AdminLocatariosList = ({ locatarios, onRefresh }: AdminLocatariosListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocatarios = locatarios?.filter(locatario =>
    locatario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locatario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locatario.store_name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-2xl font-bold">Locatarios</h2>
          <p className="text-muted-foreground">
            Gestiona y monitorea todos los locatarios del sistema
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
          placeholder="Buscar locatarios por nombre, email o tienda..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locatarios</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locatarios?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Locatarios registrados
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
              {locatarios?.reduce((sum, l) => sum + l.proveedores_count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Proveedores asociados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locatarios?.reduce((sum, l) => sum + l.products_count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos en catálogo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Locatarios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Locatarios</CardTitle>
          <CardDescription>
            Información detallada de cada locatario y su rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Locatario</TableHead>
                <TableHead>Tienda</TableHead>
                <TableHead>Proveedores</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocatarios.map((locatario) => (
                <TableRow key={locatario.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{locatario.name}</div>
                      <div className="text-sm text-muted-foreground">{locatario.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                      {locatario.store_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {locatario.proveedores_count} proveedores
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {locatario.products_count} productos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(locatario.created_at)}
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

          {filteredLocatarios.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron locatarios que coincidan con la búsqueda.' : 'No hay locatarios registrados.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
