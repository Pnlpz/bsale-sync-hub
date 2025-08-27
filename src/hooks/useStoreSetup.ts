/**
 * Store Setup Hook
 * React hook for managing store setup and creation
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StoreSetupService } from '@/services/store-setup-service';
import { useToast } from '@/hooks/use-toast';

export const useStoreSetup = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's store
  const {
    data: storeResult,
    isLoading: isLoadingStore,
    error: storeError,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ['user-store'],
    queryFn: StoreSetupService.getUserStore,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Ensure user has store mutation
  const ensureStoreMutation = useMutation({
    mutationFn: StoreSetupService.ensureUserHasStore,
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Tienda configurada',
          description: `Tu tienda "${result.store?.name}" está lista para usar`,
        });
        // Invalidate and refetch store data
        queryClient.invalidateQueries({ queryKey: ['user-store'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      } else {
        toast({
          title: 'Error al configurar tienda',
          description: result.error || 'No se pudo configurar la tienda',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error al configurar tienda',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: (data: { name?: string; address?: string }) =>
      StoreSetupService.createStoreForUser(data),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Tienda creada exitosamente',
          description: `Tu tienda "${result.store?.name}" ha sido creada`,
        });
        // Invalidate and refetch store data
        queryClient.invalidateQueries({ queryKey: ['user-store'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      } else {
        toast({
          title: 'Error al crear tienda',
          description: result.error || 'No se pudo crear la tienda',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error al crear tienda',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  return {
    // Store data
    store: storeResult?.store,
    hasStore: storeResult?.success && !!storeResult.store,
    storeError: storeResult?.error || storeError?.message,
    isLoadingStore,

    // Actions
    ensureStore: ensureStoreMutation.mutate,
    createStore: createStoreMutation.mutate,
    refetchStore,

    // Loading states
    isEnsuring: ensureStoreMutation.isPending,
    isCreating: createStoreMutation.isPending,
    isWorking: ensureStoreMutation.isPending || createStoreMutation.isPending,
  };
};

/**
 * Hook to get store ID for the current user
 * Automatically ensures user has a store if they're a locatario
 */
export const useUserStoreId = () => {
  const { store, hasStore, ensureStore, isEnsuring } = useStoreSetup();
  const [hasTriedEnsure, setHasTriedEnsure] = useState(false);

  // Auto-ensure store for locatarios if they don't have one
  const ensureStoreIfNeeded = async () => {
    if (!hasStore && !hasTriedEnsure && !isEnsuring) {
      setHasTriedEnsure(true);
      ensureStore();
    }
  };

  return {
    storeId: store?.id,
    storeName: store?.name,
    hasStore,
    ensureStoreIfNeeded,
    isEnsuring,
  };
};
