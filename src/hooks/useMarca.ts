/**
 * Marca-related React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarcaService } from '@/services/marca-service';
import { CreateMarcaData, UpdateMarcaData, ProductFilterOptions } from '@/types/marca';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';

// Query keys
export const marcaKeys = {
  all: ['marcas'] as const,
  lists: () => [...marcaKeys.all, 'list'] as const,
  list: (filters: string) => [...marcaKeys.lists(), { filters }] as const,
  details: () => [...marcaKeys.all, 'detail'] as const,
  detail: (id: string) => [...marcaKeys.details(), id] as const,
  stats: () => [...marcaKeys.all, 'stats'] as const,
  userMarca: () => [...marcaKeys.all, 'user-marca'] as const,
  filteredProducts: (storeId: string, options: ProductFilterOptions) => ['products', 'filtered', storeId, options] as const,
};

/**
 * Get all marcas accessible to current user
 */
export const useMarcas = () => {
  return useQuery({
    queryKey: marcaKeys.lists(),
    queryFn: MarcaService.getMarcas,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get a specific marca by ID
 */
export const useMarca = (id: string) => {
  return useQuery({
    queryKey: marcaKeys.detail(id),
    queryFn: () => MarcaService.getMarca(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get marcas with statistics
 */
export const useMarcasWithStats = () => {
  return useQuery({
    queryKey: marcaKeys.stats(),
    queryFn: MarcaService.getMarcasWithStats,
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
  });
};

/**
 * Get current user's marca ID
 */
export const useCurrentUserMarca = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: marcaKeys.userMarca(),
    queryFn: MarcaService.getCurrentUserMarcaId,
    enabled: profile?.role === 'proveedor',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get filtered products based on user's marca access
 */
export const useFilteredProducts = (options: ProductFilterOptions = {}) => {
  const { profile } = useAuth();
  const { currentStoreId, currentStoreMarca, isProvider } = useStoreContext();

  // For proveedor users, automatically filter by their marca in current store
  const finalOptions = isProvider && currentStoreMarca
    ? { ...options, marca_id: currentStoreMarca, store_id: currentStoreId }
    : { ...options, store_id: currentStoreId };

  return useQuery({
    queryKey: marcaKeys.filteredProducts(currentStoreId || '', finalOptions),
    queryFn: () => MarcaService.getFilteredProducts(finalOptions),
    enabled: !!currentStoreId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create a new marca (admin only)
 */
export const useCreateMarca = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (marcaData: CreateMarcaData) => MarcaService.createMarca(marcaData),
    onSuccess: (newMarca) => {
      queryClient.invalidateQueries({ queryKey: marcaKeys.all });
      toast({
        title: "Marca creada",
        description: `La marca "${newMarca.name}" se ha creado exitosamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear marca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Update a marca (admin only)
 */
export const useUpdateMarca = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMarcaData }) => 
      MarcaService.updateMarca(id, data),
    onSuccess: (updatedMarca) => {
      queryClient.invalidateQueries({ queryKey: marcaKeys.all });
      queryClient.invalidateQueries({ queryKey: marcaKeys.detail(updatedMarca.id) });
      toast({
        title: "Marca actualizada",
        description: `La marca "${updatedMarca.name}" se ha actualizado exitosamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar marca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Delete a marca (admin only)
 */
export const useDeleteMarca = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => MarcaService.deleteMarca(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marcaKeys.all });
      toast({
        title: "Marca eliminada",
        description: "La marca se ha eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar marca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Assign marca to proveedor
 */
export const useAssignMarcaToProveedor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ proveedorId, marcaId }: { proveedorId: string; marcaId: string }) =>
      MarcaService.assignMarcaToProveedor(proveedorId, marcaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: marcaKeys.all });
      toast({
        title: "Marca asignada",
        description: "La marca se ha asignado exitosamente al proveedor",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al asignar marca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Remove marca from proveedor
 */
export const useRemoveMarcaFromProveedor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (proveedorId: string) => MarcaService.removeMarcaFromProveedor(proveedorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: marcaKeys.all });
      toast({
        title: "Marca removida",
        description: "La marca se ha removido exitosamente del proveedor",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al remover marca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Check if current user can access a marca
 */
export const useCanAccessMarca = (marcaId: string) => {
  return useQuery({
    queryKey: ['marca-access', marcaId],
    queryFn: () => MarcaService.canAccessMarca(marcaId),
    enabled: !!marcaId,
    staleTime: 5 * 60 * 1000,
  });
};
