import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bsaleClient, BsaleProduct, BsaleDocument, BsaleClient, BsaleApiResponse } from '@/lib/bsale-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserMarca } from '@/hooks/useMarca';

// Products hooks with marca-based filtering
export const useBsaleProducts = (limit = 25, offset = 0) => {
  const { profile } = useAuth();
  const { data: userMarcaId } = useCurrentUserMarca();

  return useQuery({
    queryKey: ['bsale-products', limit, offset, profile?.role, userMarcaId],
    queryFn: async () => {
      const response = await bsaleClient.getProducts(limit, offset);

      // For proveedor users, we would need to filter products by marca
      // This would require additional logic to map Bsale products to marcas
      // For now, we return all products and let the UI handle filtering
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBsaleProduct = (id: number) => {
  return useQuery({
    queryKey: ['bsale-product', id],
    queryFn: () => bsaleClient.getProduct(id),
    enabled: !!id,
  });
};

export const useSearchBsaleProducts = (searchTerm: string) => {
  const { profile } = useAuth();
  const { data: userMarcaId } = useCurrentUserMarca();

  return useQuery({
    queryKey: ['bsale-products-search', searchTerm, profile?.role, userMarcaId],
    queryFn: async () => {
      const response = await bsaleClient.searchProducts(searchTerm);

      // For proveedor users, we would need to filter search results by marca
      // This would require additional logic to map Bsale products to marcas
      return response;
    },
    enabled: searchTerm.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateBsaleProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (productData: Partial<BsaleProduct>) => 
      bsaleClient.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bsale-products'] });
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente en Bsale",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Documents hooks
export const useBsaleDocuments = (limit = 25, offset = 0) => {
  return useQuery({
    queryKey: ['bsale-documents', limit, offset],
    queryFn: () => bsaleClient.getDocuments(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBsaleDocument = (id: number) => {
  return useQuery({
    queryKey: ['bsale-document', id],
    queryFn: () => bsaleClient.getDocument(id),
    enabled: !!id,
  });
};

export const useCreateBsaleDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (documentData: any) => 
      bsaleClient.createDocument(documentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bsale-documents'] });
      toast({
        title: "Documento creado",
        description: "El documento se ha creado exitosamente en Bsale",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Clients hooks
export const useBsaleClients = (limit = 25, offset = 0) => {
  return useQuery({
    queryKey: ['bsale-clients', limit, offset],
    queryFn: () => bsaleClient.getClients(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBsaleClient = (id: number) => {
  return useQuery({
    queryKey: ['bsale-client', id],
    queryFn: () => bsaleClient.getClient(id),
    enabled: !!id,
  });
};

export const useSearchBsaleClients = (email?: string, firstName?: string) => {
  return useQuery({
    queryKey: ['bsale-clients-search', email, firstName],
    queryFn: () => bsaleClient.searchClients(email, firstName),
    enabled: !!(email || firstName),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateBsaleClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (clientData: Partial<BsaleClient>) => 
      bsaleClient.createClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bsale-clients'] });
      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado exitosamente en Bsale",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Stock hooks
export const useBsaleVariantStocks = (variantId: number) => {
  return useQuery({
    queryKey: ['bsale-variant-stocks', variantId],
    queryFn: () => bsaleClient.getVariantStocks(variantId),
    enabled: !!variantId,
    staleTime: 1 * 60 * 1000, // 1 minute for stock data
  });
};

export const useBsaleProductVariants = (productId: number) => {
  return useQuery({
    queryKey: ['bsale-product-variants', productId],
    queryFn: () => bsaleClient.getProductVariants(productId),
    enabled: !!productId,
  });
};

// Sync hooks
export const useSyncProductsFromBsale = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ storeId, proveedorId }: { storeId: string; proveedorId: string }) =>
      import('@/services/bsale-sync').then(({ BsaleSyncService }) =>
        BsaleSyncService.syncProductsFromBsale(storeId, proveedorId)
      ),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Sincronización exitosa",
          description: result.message,
        });
      } else {
        toast({
          title: "Sincronización con errores",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error en sincronización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSyncSalesFromBsale = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ storeId, proveedorId }: { storeId: string; proveedorId: string }) =>
      import('@/services/bsale-sync').then(({ BsaleSyncService }) =>
        BsaleSyncService.syncSalesFromBsale(storeId, proveedorId)
      ),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Sincronización de ventas exitosa",
          description: result.message,
        });
      } else {
        toast({
          title: "Sincronización de ventas con errores",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error en sincronización de ventas",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateProductInBsale = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (productId: string) =>
      import('@/services/bsale-sync').then(({ BsaleSyncService }) =>
        BsaleSyncService.createProductInBsale(productId)
      ),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Producto creado en Bsale",
          description: result.message,
        });
      } else {
        toast({
          title: "Error al crear producto",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear producto en Bsale",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
