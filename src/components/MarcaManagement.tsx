/**
 * Marca Management Component
 * Admin-only component for managing brands/marcas
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, Package, AlertCircle } from 'lucide-react';
import { 
  useMarcasWithStats, 
  useCreateMarca, 
  useUpdateMarca, 
  useDeleteMarca,
  useAssignMarcaToProveedor,
  useRemoveMarcaFromProveedor 
} from '@/hooks/useMarca';
import { CreateMarcaData, UpdateMarcaData } from '@/types/marca';

const MarcaManagement: React.FC = () => {
  const { profile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<any>(null);
  const [createForm, setCreateForm] = useState<CreateMarcaData>({ name: '', description: '' });
  const [editForm, setEditForm] = useState<UpdateMarcaData>({ name: '', description: '' });

  // Hooks
  const { data: marcas, isLoading } = useMarcasWithStats();
  const createMarca = useCreateMarca();
  const updateMarca = useUpdateMarca();
  const deleteMarca = useDeleteMarca();
  const assignMarca = useAssignMarcaToProveedor();
  const removeMarca = useRemoveMarcaFromProveedor();

  // Only show for admin users
  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Solo los administradores pueden gestionar marcas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCreateMarca = async () => {
    if (!createForm.name.trim()) return;
    
    try {
      await createMarca.mutateAsync(createForm);
      setCreateForm({ name: '', description: '' });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating marca:', error);
    }
  };

  const handleEditMarca = async () => {
    if (!selectedMarca || !editForm.name?.trim()) return;
    
    try {
      await updateMarca.mutateAsync({
        id: selectedMarca.id,
        data: editForm
      });
      setEditForm({ name: '', description: '' });
      setSelectedMarca(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating marca:', error);
    }
  };

  const handleDeleteMarca = async (marcaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta marca?')) return;
    
    try {
      await deleteMarca.mutateAsync(marcaId);
    } catch (error) {
      console.error('Error deleting marca:', error);
    }
  };

  const openEditDialog = (marca: any) => {
    setSelectedMarca(marca);
    setEditForm({
      name: marca.name,
      description: marca.description || ''
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Marcas</h2>
          <p className="text-muted-foreground">
            Administra las marcas y su asignación a proveedores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Marca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Marca</DialogTitle>
              <DialogDescription>
                Agrega una nueva marca al sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Nombre de la marca"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Descripción de la marca (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMarca} disabled={createMarca.isPending}>
                {createMarca.isPending ? 'Creando...' : 'Crear Marca'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcas Registradas</CardTitle>
          <CardDescription>
            Lista de todas las marcas en el sistema con estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marcas && marcas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-center">Ventas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marcas.map((marca) => (
                  <TableRow key={marca.id}>
                    <TableCell>
                      <div className="font-medium">{marca.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {marca.description || 'Sin descripción'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {marca.product_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        ${marca.total_sales.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(marca)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMarca(marca.id)}
                          disabled={marca.product_count > 0}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay marcas registradas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crea la primera marca para comenzar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Marca</DialogTitle>
            <DialogDescription>
              Modifica la información de la marca
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nombre de la marca"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descripción de la marca (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMarca} disabled={updateMarca.isPending}>
              {updateMarca.isPending ? 'Actualizando...' : 'Actualizar Marca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarcaManagement;
