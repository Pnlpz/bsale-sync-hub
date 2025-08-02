/**
 * Marca Service
 * Handles all marca-related database operations and business logic
 */

import { supabase } from '@/integrations/supabase/client';
import { Marca, CreateMarcaData, UpdateMarcaData, MarcaWithStats, ProductFilterOptions } from '@/types/marca';

export class MarcaService {
  
  /**
   * Get all marcas accessible to the current user
   */
  static async getMarcas(): Promise<Marca[]> {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error fetching marcas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific marca by ID
   */
  static async getMarca(id: string): Promise<Marca | null> {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching marca: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new marca (admin only)
   */
  static async createMarca(marcaData: CreateMarcaData): Promise<Marca> {
    const { data, error } = await supabase
      .from('marcas')
      .insert(marcaData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating marca: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a marca (admin only)
   */
  static async updateMarca(id: string, marcaData: UpdateMarcaData): Promise<Marca> {
    const { data, error } = await supabase
      .from('marcas')
      .update(marcaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating marca: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a marca (admin only)
   */
  static async deleteMarca(id: string): Promise<void> {
    const { error } = await supabase
      .from('marcas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting marca: ${error.message}`);
    }
  }

  /**
   * Get marcas with statistics
   */
  static async getMarcasWithStats(): Promise<MarcaWithStats[]> {
    const { data, error } = await supabase
      .from('marcas')
      .select(`
        *,
        products:products(count),
        active_products:products!inner(count),
        sales:sales(total_amount)
      `)
      .eq('products.state', 0) // Only active products
      .order('name');

    if (error) {
      throw new Error(`Error fetching marcas with stats: ${error.message}`);
    }

    // Transform the data to include calculated stats
    return (data || []).map(marca => ({
      ...marca,
      product_count: marca.products?.[0]?.count || 0,
      active_products: marca.active_products?.[0]?.count || 0,
      total_sales: marca.sales?.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) || 0,
    }));
  }

  /**
   * Get current user's marca ID
   */
  static async getCurrentUserMarcaId(): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_user_marca_id');

    if (error) {
      console.error('Error getting user marca ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if current user can access a specific marca
   */
  static async canAccessMarca(marcaId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_access_marca', {
      target_marca_id: marcaId
    });

    if (error) {
      console.error('Error checking marca access:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Get products filtered by user's marca access
   */
  static async getFilteredProducts(options: ProductFilterOptions = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        marca:marcas(*)
      `);

    // Apply filters based on options
    if (options.marca_id) {
      query = query.eq('marca_id', options.marca_id);
    }

    if (options.proveedor_id) {
      query = query.eq('proveedor_id', options.proveedor_id);
    }

    if (options.store_id) {
      query = query.eq('store_id', options.store_id);
    }

    if (options.search_term) {
      query = query.ilike('name', `%${options.search_term}%`);
    }

    if (!options.include_inactive) {
      query = query.eq('state', 0); // Only active products
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching filtered products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign a marca to a proveedor user
   */
  static async assignMarcaToProveedor(proveedorId: string, marcaId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ marca_id: marcaId })
      .eq('id', proveedorId)
      .eq('role', 'proveedor');

    if (error) {
      throw new Error(`Error assigning marca to proveedor: ${error.message}`);
    }
  }

  /**
   * Remove marca assignment from a proveedor user
   */
  static async removeMarcaFromProveedor(proveedorId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ marca_id: null })
      .eq('id', proveedorId)
      .eq('role', 'proveedor');

    if (error) {
      throw new Error(`Error removing marca from proveedor: ${error.message}`);
    }
  }

  /**
   * Get all proveedores for a specific marca
   */
  static async getProveedoresByMarca(marcaId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('marca_id', marcaId)
      .eq('role', 'proveedor')
      .order('name');

    if (error) {
      throw new Error(`Error fetching proveedores by marca: ${error.message}`);
    }

    return data || [];
  }
}
