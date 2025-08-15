/**
 * Store Management Hooks
 * React Query hooks for multi-tenant store management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { StoreService } from '@/services/store-service';
import {
  CreateStoreData,
  UpdateStoreData,
  StoreProviderFilters,
  AssignMarcaToProviderData,
  Store,
  StoreWithDetails,
  UserStoreAccess,
  ProviderDashboardData,
} from '@/types/invitation';

// Query Keys
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (filters?: any) => [...storeKeys.lists(), filters] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
  userStores: () => [...storeKeys.all, 'user-stores'] as const,
  providers: () => [...storeKeys.all, 'providers'] as const,
  providersList: (filters: StoreProviderFilters) => [...storeKeys.providers(), filters] as const,
  providerDashboard: () => [...storeKeys.all, 'provider-dashboard'] as const,
  access: (storeId: string) => [...storeKeys.all, 'access', storeId] as const,
  providerMarca: (storeId: string) => [...storeKeys.all, 'provider-marca', storeId] as const,
};

/**
 * Get stores with details
 */
export const useStores = () => {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: () => StoreService.getStoresWithDetails(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get user's accessible stores
 */
export const useUserStores = () => {
  return useQuery({
    queryKey: storeKeys.userStores(),
    queryFn: () => StoreService.getUserAccessibleStores(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get store by ID
 */
export const useStore = (storeId: string) => {
  return useQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn: () => StoreService.getStore(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get store providers
 */
export const useStoreProviders = (filters: StoreProviderFilters = {}) => {
  return useQuery({
    queryKey: storeKeys.providersList(filters),
    queryFn: () => StoreService.getStoreProviders(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get provider dashboard data
 */
export const useProviderDashboard = () => {
  return useQuery({
    queryKey: storeKeys.providerDashboard(),
    queryFn: () => StoreService.getProviderDashboardData(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Check if user can access store
 */
export const useCanAccessStore = (storeId: string) => {
  return useQuery({
    queryKey: storeKeys.access(storeId),
    queryFn: () => StoreService.canAccessStore(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get provider's marca in specific store
 */
export const useProviderMarcaInStore = (storeId: string) => {
  return useQuery({
    queryKey: storeKeys.providerMarca(storeId),
    queryFn: () => StoreService.getProviderMarcaInStore(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create store mutation
 */
export const useCreateStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStoreData) => StoreService.createStore(data),
    onSuccess: (store: Store) => {
      // Invalidate and refetch store lists
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores() });
      
      toast({
        title: 'Tienda creada',
        description: `La tienda "${store.name}" ha sido creada exitosamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear tienda',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Update store mutation
 */
export const useUpdateStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: UpdateStoreData }) =>
      StoreService.updateStore(storeId, data),
    onSuccess: (store: Store) => {
      // Invalidate and refetch store data
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(store.id) });
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores() });
      
      toast({
        title: 'Tienda actualizada',
        description: `La tienda "${store.name}" ha sido actualizada exitosamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar tienda',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Delete store mutation
 */
export const useDeleteStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (storeId: string) => StoreService.deleteStore(storeId),
    onSuccess: () => {
      // Invalidate and refetch store lists
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores() });
      
      toast({
        title: 'Tienda eliminada',
        description: 'La tienda ha sido desactivada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar tienda',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Assign marca to provider mutation
 */
export const useAssignMarcaToProvider = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: AssignMarcaToProviderData) => StoreService.assignMarcaToProvider(data),
    onSuccess: (storeProvider) => {
      // Invalidate provider lists
      queryClient.invalidateQueries({ queryKey: storeKeys.providers() });
      queryClient.invalidateQueries({ queryKey: storeKeys.providerMarca(storeProvider.store_id) });
      
      toast({
        title: 'Marca asignada',
        description: 'La marca ha sido asignada al proveedor exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al asignar marca',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Remove provider from store mutation
 */
export const useRemoveProviderFromStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ storeId, providerId }: { storeId: string; providerId: string }) =>
      StoreService.removeProviderFromStore(storeId, providerId),
    onSuccess: () => {
      // Invalidate provider lists
      queryClient.invalidateQueries({ queryKey: storeKeys.providers() });
      
      toast({
        title: 'Proveedor removido',
        description: 'El proveedor ha sido removido de la tienda',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al remover proveedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Reactivate provider in store mutation
 */
export const useReactivateProviderInStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ storeId, providerId }: { storeId: string; providerId: string }) =>
      StoreService.reactivateProviderInStore(storeId, providerId),
    onSuccess: () => {
      // Invalidate provider lists
      queryClient.invalidateQueries({ queryKey: storeKeys.providers() });
      
      toast({
        title: 'Proveedor reactivado',
        description: 'El proveedor ha sido reactivado en la tienda',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al reactivar proveedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
