/**
 * Store Service
 * Handles multi-tenant store management and provider relationships
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Store,
  StoreWithDetails,
  CreateStoreData,
  UpdateStoreData,
  StoreProvider,
  StoreProviderWithDetails,
  StoreProviderFilters,
  AssignMarcaToProviderData,
  UserStoreAccess,
  ProviderDashboardData,
  StoreAccessDeniedError,
} from '@/types/invitation';

export class StoreService {
  /**
   * Create a new store
   */
  static async createStore(data: CreateStoreData): Promise<Store> {
    // Get current user profile to set as locatario
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    if (profile.role !== 'locatario' && profile.role !== 'admin') {
      throw new Error('Only locatarios and admins can create stores');
    }

    const storeData = {
      ...data,
      locatario_id: profile.id,
      settings: data.settings || {},
    };

    const { data: store, error } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create store: ${error.message}`);
    }

    return store;
  }

  /**
   * Get stores with details
   */
  static async getStoresWithDetails(): Promise<StoreWithDetails[]> {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        locatario:profiles!stores_locatario_id_fkey(id, name, email),
        store_providers(id),
        products(id),
        marcas:store_providers(marca_id)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }

    return (data || []).map((store: any) => ({
      ...store,
      provider_count: store.store_providers?.length || 0,
      product_count: store.products?.length || 0,
      marca_count: new Set(
        store.marcas?.map((sp: any) => sp.marca_id).filter(Boolean)
      ).size,
    }));
  }

  /**
   * Get user's accessible stores
   */
  static async getUserAccessibleStores(): Promise<UserStoreAccess[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('get_user_accessible_stores', {
      user_id: user.user.id,
    });

    if (error) {
      throw new Error(`Failed to fetch accessible stores: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get store by ID with access check
   */
  static async getStore(storeId: string): Promise<StoreWithDetails> {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        locatario:profiles!stores_locatario_id_fkey(id, name, email),
        store_providers(id),
        products(id),
        marcas:store_providers(marca_id)
      `)
      .eq('id', storeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new StoreAccessDeniedError('Store not found or access denied');
      }
      throw new Error(`Failed to fetch store: ${error.message}`);
    }

    return {
      ...data,
      provider_count: data.store_providers?.length || 0,
      product_count: data.products?.length || 0,
      marca_count: new Set(
        data.marcas?.map((sp: any) => sp.marca_id).filter(Boolean)
      ).size,
    };
  }

  /**
   * Update store
   */
  static async updateStore(storeId: string, data: UpdateStoreData): Promise<Store> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: store, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update store: ${error.message}`);
    }

    return store;
  }

  /**
   * Delete store (soft delete by setting is_active to false)
   */
  static async deleteStore(storeId: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }

  /**
   * Get store providers with details
   */
  static async getStoreProviders(filters: StoreProviderFilters = {}): Promise<StoreProviderWithDetails[]> {
    let query = supabase
      .from('store_providers')
      .select(`
        *,
        store:stores(id, name, address, is_active),
        provider:profiles!store_providers_provider_id_fkey(id, name, email, role),
        marca:marcas(id, name, description)
      `);

    if (filters.store_id) {
      query = query.eq('store_id', filters.store_id);
    }
    if (filters.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }
    if (filters.marca_id) {
      query = query.eq('marca_id', filters.marca_id);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch store providers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign marca to provider in store
   */
  static async assignMarcaToProvider(data: AssignMarcaToProviderData): Promise<StoreProvider> {
    const { data: storeProvider, error } = await supabase
      .from('store_providers')
      .update({
        marca_id: data.marca_id,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', data.store_id)
      .eq('provider_id', data.provider_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign marca to provider: ${error.message}`);
    }

    return storeProvider;
  }

  /**
   * Remove provider from store
   */
  static async removeProviderFromStore(storeId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('store_providers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('provider_id', providerId);

    if (error) {
      throw new Error(`Failed to remove provider from store: ${error.message}`);
    }
  }

  /**
   * Reactivate provider in store
   */
  static async reactivateProviderInStore(storeId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('store_providers')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('provider_id', providerId);

    if (error) {
      throw new Error(`Failed to reactivate provider in store: ${error.message}`);
    }
  }

  /**
   * Get provider's marca in specific store
   */
  static async getProviderMarcaInStore(storeId: string): Promise<string | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_provider_marca_in_store', {
      user_id: user.user.id,
      target_store_id: storeId,
    });

    if (error) {
      console.error('Failed to get provider marca in store:', error);
      return null;
    }

    return data;
  }

  /**
   * Get provider dashboard data for multi-store experience
   */
  static async getProviderDashboardData(): Promise<ProviderDashboardData> {
    const accessibleStores = await this.getUserAccessibleStores();
    
    const storeData = await Promise.all(
      accessibleStores
        .filter(store => store.role_in_store === 'proveedor')
        .map(async (store) => {
          // Get product count for this store and marca
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('store_id', store.store_id)
            .eq('marca_id', store.marca_id || '');

          // Get recent sales count
          const { data: sales } = await supabase
            .from('sales')
            .select('id')
            .eq('store_id', store.store_id)
            .gte('sale_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          // Get low stock alerts
          const { data: alerts } = await supabase
            .from('alerts')
            .select('id')
            .eq('store_id', store.store_id)
            .eq('type', 'low_stock')
            .eq('is_read', false);

          // Get marca name
          const { data: marca } = store.marca_id
            ? await supabase
                .from('marcas')
                .select('name')
                .eq('id', store.marca_id)
                .single()
            : { data: null };

          return {
            store_id: store.store_id,
            store_name: store.store_name,
            marca_name: marca?.name,
            product_count: products?.length || 0,
            recent_sales_count: sales?.length || 0,
            low_stock_alerts: alerts?.length || 0,
          };
        })
    );

    const totals = storeData.reduce(
      (acc, store) => ({
        total_products: acc.total_products + store.product_count,
        total_sales: acc.total_sales + store.recent_sales_count,
        total_alerts: acc.total_alerts + store.low_stock_alerts,
      }),
      { total_products: 0, total_sales: 0, total_alerts: 0 }
    );

    return {
      stores: storeData,
      ...totals,
    };
  }

  /**
   * Check if user can access store
   */
  static async canAccessStore(storeId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    const { data, error } = await supabase.rpc('can_access_store', {
      user_id: user.user.id,
      target_store_id: storeId,
    });

    if (error) {
      console.error('Failed to check store access:', error);
      return false;
    }

    return data || false;
  }
}
