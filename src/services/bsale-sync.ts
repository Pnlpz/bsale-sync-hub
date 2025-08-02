import { supabase } from '@/integrations/supabase/client';
import { bsaleClient, BsaleProduct, BsaleDocument } from '@/lib/bsale-client';
import { MarcaService } from '@/services/marca-service';

export interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  errors: string[];
}

/**
 * Service to sync data between Supabase and Bsale
 */
export class BsaleSyncService {
  
  /**
   * Sync products from Bsale to Supabase with marca assignment
   */
  static async syncProductsFromBsale(storeId: string, proveedorId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get the proveedor's marca_id
      const { data: proveedorProfile } = await supabase
        .from('profiles')
        .select('marca_id')
        .eq('id', proveedorId)
        .single();

      const marcaId = proveedorProfile?.marca_id;

      // Get products from Bsale
      const bsaleResponse = await bsaleClient.getProducts(100, 0);
      
      for (const bsaleProduct of bsaleResponse.items) {
        try {
          // Check if product already exists in Supabase
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('bsale_product_id', bsaleProduct.id.toString())
            .single();

          const productData = {
            name: bsaleProduct.name,
            description: bsaleProduct.description || '',
            price: 0, // You might want to get this from variants
            stock: 0, // You might want to get this from variants
            bsale_product_id: bsaleProduct.id.toString(),
            store_id: storeId,
            proveedor_id: proveedorId,
            marca_id: marcaId, // Assign the proveedor's marca to the product
            updated_at: new Date().toISOString(),
          };

          if (existingProduct) {
            // Update existing product
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('id', existingProduct.id);

            if (error) throw error;
          } else {
            // Create new product
            const { error } = await supabase
              .from('products')
              .insert(productData);

            if (error) throw error;
          }

          synced++;
        } catch (error) {
          errors.push(`Error syncing product ${bsaleProduct.name}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        message: `Sincronización completada. ${synced} productos sincronizados.`,
        synced,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        message: `Error durante la sincronización: ${error.message}`,
        synced,
        errors: [error.message],
      };
    }
  }

  /**
   * Sync sales from Bsale to Supabase
   */
  static async syncSalesFromBsale(storeId: string, proveedorId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get documents (sales) from Bsale
      const bsaleResponse = await bsaleClient.getDocuments(100, 0);
      
      for (const bsaleDocument of bsaleResponse.items) {
        try {
          // Only process sales documents (you might need to filter by document type)
          if (bsaleDocument.state === 0) { // Active documents
            
            // Check if sale already exists in Supabase
            const { data: existingSale } = await supabase
              .from('sales')
              .select('id')
              .eq('bsale_sale_id', bsaleDocument.id.toString())
              .single();

            // You'll need to get the product_id from your local database
            // This is a simplified example - you might need to match products differently
            const { data: product } = await supabase
              .from('products')
              .select('id')
              .eq('store_id', storeId)
              .limit(1)
              .single();

            if (!product) {
              errors.push(`No product found for sale ${bsaleDocument.id}`);
              continue;
            }

            const saleData = {
              product_id: product.id,
              store_id: storeId,
              proveedor_id: proveedorId,
              quantity: 1, // You'll need to get this from document details
              total_amount: bsaleDocument.totalAmount,
              sale_date: new Date(bsaleDocument.emissionDate * 1000).toISOString(),
              bsale_sale_id: bsaleDocument.id.toString(),
            };

            if (existingSale) {
              // Update existing sale
              const { error } = await supabase
                .from('sales')
                .update(saleData)
                .eq('id', existingSale.id);

              if (error) throw error;
            } else {
              // Create new sale
              const { error } = await supabase
                .from('sales')
                .insert(saleData);

              if (error) throw error;
            }

            synced++;
          }
        } catch (error) {
          errors.push(`Error syncing sale ${bsaleDocument.id}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        message: `Sincronización de ventas completada. ${synced} ventas sincronizadas.`,
        synced,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        message: `Error durante la sincronización de ventas: ${error.message}`,
        synced,
        errors: [error.message],
      };
    }
  }

  /**
   * Create a product in Bsale from Supabase data
   */
  static async createProductInBsale(productId: string): Promise<SyncResult> {
    try {
      // Get product from Supabase
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !product) {
        return {
          success: false,
          message: 'Producto no encontrado en la base de datos',
          synced: 0,
          errors: [error?.message || 'Product not found'],
        };
      }

      // Create product in Bsale
      const bsaleProduct = await bsaleClient.createProduct({
        name: product.name,
        description: product.description,
        classification: 1, // You might want to make this configurable
        productTypeId: 5, // You might want to make this configurable
      });

      // Update Supabase product with Bsale ID
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          bsale_product_id: bsaleProduct.id.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Producto creado exitosamente en Bsale',
        synced: 1,
        errors: [],
      };

    } catch (error) {
      return {
        success: false,
        message: `Error al crear producto en Bsale: ${error.message}`,
        synced: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Update stock in Bsale (this would require more complex logic)
   */
  static async updateStockInBsale(productId: string, newStock: number): Promise<SyncResult> {
    try {
      // Get product from Supabase
      const { data: product, error } = await supabase
        .from('products')
        .select('bsale_product_id')
        .eq('id', productId)
        .single();

      if (error || !product || !product.bsale_product_id) {
        return {
          success: false,
          message: 'Producto no tiene ID de Bsale asociado',
          synced: 0,
          errors: ['Product not linked to Bsale'],
        };
      }

      // Note: Bsale stock updates are more complex and require variant management
      // This is a simplified example - you'd need to implement the full stock update logic
      
      return {
        success: true,
        message: 'Stock actualizado (implementación pendiente)',
        synced: 1,
        errors: [],
      };

    } catch (error) {
      return {
        success: false,
        message: `Error al actualizar stock: ${error.message}`,
        synced: 0,
        errors: [error.message],
      };
    }
  }
}
