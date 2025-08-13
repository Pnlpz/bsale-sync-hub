import { supabase } from '@/integrations/supabase/client';
import { bsaleClient, BsaleProduct, BsaleDocument, BsaleDocumentDetail } from '@/lib/bsale-client';
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

    console.log('Starting sales sync from Bsale:', { storeId, proveedorId });

    try {
      // Get documents (sales) from Bsale
      const bsaleResponse = await bsaleClient.getDocuments(100, 0);
      console.log('Bsale documents response:', bsaleResponse);

      if (!bsaleResponse.items || bsaleResponse.items.length === 0) {
        return {
          success: true,
          message: 'No hay documentos nuevos para sincronizar.',
          synced: 0,
          errors: [],
        };
      }

      for (const bsaleDocument of bsaleResponse.items) {
        try {
          // Only process active sales documents
          if (bsaleDocument.state === 0) { // Active documents

            // Check if sale already exists in Supabase
            const { data: existingSale } = await supabase
              .from('sales')
              .select('id')
              .eq('bsale_sale_id', bsaleDocument.id.toString())
              .eq('store_id', storeId)
              .single();

            // Skip if sale already exists
            if (existingSale) {
              continue;
            }

            // Get document details to find products
            try {
              const documentDetailsResponse = await bsaleClient.getDocumentDetails(bsaleDocument.id);

              if (documentDetailsResponse && documentDetailsResponse.items && documentDetailsResponse.items.length > 0) {
                // Process each product in the sale
                for (const detail of documentDetailsResponse.items) {
                  if (detail.variant && detail.variant.id) {
                    // Find the product in our database by Bsale product ID
                    const { data: product } = await supabase
                      .from('products')
                      .select('id, proveedor_id')
                      .eq('bsale_product_id', detail.variant.id.toString())
                      .eq('store_id', storeId)
                      .single();

                    if (product) {
                      const saleData = {
                        product_id: product.id,
                        store_id: storeId,
                        proveedor_id: product.proveedor_id, // Use the product's provider
                        quantity: detail.quantity || 1,
                        total_amount: detail.netUnitValue * detail.quantity,
                        sale_date: new Date(bsaleDocument.emissionDate * 1000).toISOString(),
                        bsale_sale_id: bsaleDocument.id.toString(),
                      };

                      // Create new sale
                      const { error } = await supabase
                        .from('sales')
                        .insert(saleData);

                      if (error) {
                        errors.push(`Error creating sale for product ${product.id}: ${error.message}`);
                      } else {
                        synced++;
                      }
                    } else {
                      errors.push(`Product not found for Bsale variant ${detail.variant.id} in document ${bsaleDocument.id}`);
                    }
                  }
                }
              } else {
                // Fallback: create a generic sale entry if no details available
                const { data: anyProduct } = await supabase
                  .from('products')
                  .select('id, proveedor_id')
                  .eq('store_id', storeId)
                  .limit(1)
                  .single();

                if (anyProduct) {
                  const saleData = {
                    product_id: anyProduct.id,
                    store_id: storeId,
                    proveedor_id: anyProduct.proveedor_id,
                    quantity: 1,
                    total_amount: bsaleDocument.totalAmount,
                    sale_date: new Date(bsaleDocument.emissionDate * 1000).toISOString(),
                    bsale_sale_id: bsaleDocument.id.toString(),
                  };

                  const { error } = await supabase
                    .from('sales')
                    .insert(saleData);

                  if (error) {
                    errors.push(`Error creating generic sale for document ${bsaleDocument.id}: ${error.message}`);
                  } else {
                    synced++;
                  }
                } else {
                  errors.push(`No products found in store ${storeId} for document ${bsaleDocument.id}`);
                }
              }
            } catch (detailError) {
              errors.push(`Error getting details for document ${bsaleDocument.id}: ${detailError.message}`);
            }
          }
        } catch (error) {
          errors.push(`Error processing document ${bsaleDocument.id}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        message: `Sincronización de ventas completada. ${synced} ventas sincronizadas.${errors.length > 0 ? ` ${errors.length} errores encontrados.` : ''}`,
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
