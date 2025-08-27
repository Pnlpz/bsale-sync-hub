/**
 * Store Setup Service
 * Handles automatic store creation for locatarios and store management
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateStoreForUserData {
  name?: string;
  address?: string;
}

export class StoreSetupService {
  /**
   * Create a default store for a locatario user
   */
  static async createStoreForUser(data: CreateStoreForUserData = {}): Promise<{
    success: boolean;
    store?: any;
    error?: string;
  }> {
    try {
      // Get current user profile
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role, store_id')
        .eq('user_id', user.user.id)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      if (profile.role !== 'locatario' && profile.role !== 'admin') {
        return { success: false, error: 'Only locatarios can create stores' };
      }

      // Check if user already has a store
      if (profile.store_id) {
        const { data: existingStore } = await supabase
          .from('stores')
          .select('*')
          .eq('id', profile.store_id)
          .single();

        if (existingStore) {
          return { success: true, store: existingStore };
        }
      }

      // Check if user already owns a store (by locatario_id)
      const { data: existingStoreByOwner } = await supabase
        .from('stores')
        .select('*')
        .eq('locatario_id', profile.id)
        .single();

      if (existingStoreByOwner) {
        // Update profile to reference this store
        await supabase
          .from('profiles')
          .update({ store_id: existingStoreByOwner.id })
          .eq('id', profile.id);

        return { success: true, store: existingStoreByOwner };
      }

      // Create new store using database function (bypasses RLS issues)
      const storeName = data.name || `Tienda de ${profile.name}`;
      const storeAddress = data.address || 'Dirección por definir';

      console.log('Attempting to create store using database function:', {
        name: storeName,
        address: storeAddress,
        locatario_id: profile.id,
        userRole: profile.role
      });

      const { data: functionResult, error: functionError } = await supabase.rpc(
        'create_store_for_locatario',
        {
          store_name: storeName,
          store_address: storeAddress,
        }
      );

      if (functionError) {
        console.error('Error calling create_store_for_locatario function:', functionError);
        return { success: false, error: `Failed to create store: ${functionError.message}` };
      }

      if (!functionResult.success) {
        console.error('Store creation function returned error:', functionResult);
        return { success: false, error: functionResult.error || 'Unknown error from store creation function' };
      }

      const newStore = functionResult.store;
      console.log('Store created successfully:', newStore);

      // The database function already handles profile updates
      return { success: true, store: newStore };

    } catch (error: any) {
      console.error('Error in createStoreForUser:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get or create store for current user
   */
  static async ensureUserHasStore(): Promise<{
    success: boolean;
    store?: any;
    error?: string;
  }> {
    try {
      // First try to get existing store
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role, store_id')
        .eq('user_id', user.user.id)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Check if profile has store_id and store exists
      if (profile.store_id) {
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('id', profile.store_id)
          .single();

        if (store) {
          return { success: true, store };
        }
      }

      // Check if user owns a store by locatario_id
      const { data: ownedStore } = await supabase
        .from('stores')
        .select('*')
        .eq('locatario_id', profile.id)
        .single();

      if (ownedStore) {
        // Update profile to reference this store
        await supabase
          .from('profiles')
          .update({ store_id: ownedStore.id })
          .eq('id', profile.id);

        return { success: true, store: ownedStore };
      }

      // If no store exists, create one for locatarios
      if (profile.role === 'locatario') {
        return await this.createStoreForUser();
      }

      return { success: false, error: 'No store found and user is not a locatario' };

    } catch (error: any) {
      console.error('Error in ensureUserHasStore:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get user's store information
   */
  static async getUserStore(): Promise<{
    success: boolean;
    store?: any;
    error?: string;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          role, 
          store_id,
          store:stores(*)
        `)
        .eq('user_id', user.user.id)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // If profile has a store relationship, return it
      if (profile.store) {
        return { success: true, store: profile.store };
      }

      // If no store in profile, check if user owns a store
      const { data: ownedStore } = await supabase
        .from('stores')
        .select('*')
        .eq('locatario_id', profile.id)
        .single();

      if (ownedStore) {
        return { success: true, store: ownedStore };
      }

      return { success: false, error: 'No store found for user' };

    } catch (error: any) {
      console.error('Error in getUserStore:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}
