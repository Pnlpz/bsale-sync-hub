/**
 * Store Context Hook
 * Provides easy access to current store context and switching functionality
 */

import { useAuth } from './useAuth';
import { UserStoreAccess } from '@/types/invitation';

export const useStoreContext = () => {
  const { storeContext, switchStore, refreshStoreContext } = useAuth();

  /**
   * Get current store information
   */
  const getCurrentStore = (): UserStoreAccess | null => {
    if (!storeContext.current_store_id) {
      return null;
    }

    return storeContext.accessible_stores.find(
      store => store.store_id === storeContext.current_store_id
    ) || null;
  };

  /**
   * Get current store ID
   */
  const getCurrentStoreId = (): string | null => {
    return storeContext.current_store_id || null;
  };

  /**
   * Get all accessible stores
   */
  const getAccessibleStores = (): UserStoreAccess[] => {
    return storeContext.accessible_stores;
  };

  /**
   * Check if user has access to multiple stores
   */
  const hasMultipleStores = (): boolean => {
    return storeContext.accessible_stores.length > 1;
  };

  /**
   * Check if user has access to any stores
   */
  const hasStoreAccess = (): boolean => {
    return storeContext.accessible_stores.length > 0;
  };

  /**
   * Get user's role in current store
   */
  const getCurrentStoreRole = (): string | null => {
    const currentStore = getCurrentStore();
    return currentStore?.role_in_store || null;
  };

  /**
   * Get user's marca in current store (for providers)
   */
  const getCurrentStoreMarca = (): string | null => {
    const currentStore = getCurrentStore();
    return currentStore?.marca_id || null;
  };

  /**
   * Check if user is a provider in current store
   */
  const isProviderInCurrentStore = (): boolean => {
    return getCurrentStoreRole() === 'proveedor';
  };

  /**
   * Check if user is a locatario in current store
   */
  const isLocatarioInCurrentStore = (): boolean => {
    return getCurrentStoreRole() === 'locatario';
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = (): boolean => {
    return getCurrentStoreRole() === 'admin';
  };

  /**
   * Get stores where user is a provider
   */
  const getProviderStores = (): UserStoreAccess[] => {
    return storeContext.accessible_stores.filter(
      store => store.role_in_store === 'proveedor'
    );
  };

  /**
   * Get stores where user is a locatario
   */
  const getLocatarioStores = (): UserStoreAccess[] => {
    return storeContext.accessible_stores.filter(
      store => store.role_in_store === 'locatario'
    );
  };

  /**
   * Switch to a specific store
   */
  const switchToStore = (storeId: string) => {
    switchStore(storeId);
  };

  /**
   * Switch to first available store
   */
  const switchToFirstStore = () => {
    const firstStore = storeContext.accessible_stores[0];
    if (firstStore) {
      switchStore(firstStore.store_id);
    }
  };

  /**
   * Refresh store context
   */
  const refresh = async () => {
    await refreshStoreContext();
  };

  return {
    // State
    storeContext,
    currentStore: getCurrentStore(),
    currentStoreId: getCurrentStoreId(),
    accessibleStores: getAccessibleStores(),
    
    // Computed properties
    hasMultipleStores: hasMultipleStores(),
    hasStoreAccess: hasStoreAccess(),
    currentStoreRole: getCurrentStoreRole(),
    currentStoreMarca: getCurrentStoreMarca(),
    isProvider: isProviderInCurrentStore(),
    isLocatario: isLocatarioInCurrentStore(),
    isAdmin: isAdmin(),
    providerStores: getProviderStores(),
    locatarioStores: getLocatarioStores(),
    
    // Actions
    switchToStore,
    switchToFirstStore,
    refresh,
  };
};
