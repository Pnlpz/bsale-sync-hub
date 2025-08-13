/**
 * Invitation System Types
 * Types for the multi-tenant invitation-based system
 */

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type UserRole = 'proveedor' | 'locatario' | 'admin';

export interface Invitation {
  id: string;
  token: string;
  email: string;
  store_id: string;
  invited_by: string;
  role: UserRole;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  accepted_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InvitationWithDetails extends Invitation {
  store: {
    id: string;
    name: string;
    address: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  accepter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationData {
  email: string;
  store_id: string;
  role?: UserRole;
  expires_in_hours?: number;
  metadata?: Record<string, any>;
}

export interface StoreProvider {
  id: string;
  store_id: string;
  provider_id: string;
  marca_id?: string;
  is_active: boolean;
  invited_at: string;
  created_at: string;
  updated_at: string;
}

export interface StoreProviderWithDetails extends StoreProvider {
  store: {
    id: string;
    name: string;
    address: string;
    is_active: boolean;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  marca?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface Store {
  id: string;
  name: string;
  address: string;
  locatario_id: string;
  bsale_store_id?: string;
  bsale_api_token?: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StoreWithDetails extends Store {
  locatario: {
    id: string;
    name: string;
    email: string;
  };
  provider_count: number;
  product_count: number;
  marca_count: number;
}

export interface UserStoreAccess {
  store_id: string;
  store_name: string;
  role_in_store: 'admin' | 'locatario' | 'proveedor';
  marca_id?: string;
}

export interface InvitationAcceptanceResult {
  success: boolean;
  error?: string;
  store_id?: string;
  invitation_id?: string;
}

export interface InvitationFilters {
  store_id?: string;
  status?: InvitationStatus;
  role?: UserRole;
  email?: string;
}

export interface StoreProviderFilters {
  store_id?: string;
  provider_id?: string;
  marca_id?: string;
  is_active?: boolean;
}

export interface CreateStoreData {
  name: string;
  address: string;
  bsale_store_id?: string;
  bsale_api_token?: string;
  settings?: Record<string, any>;
}

export interface UpdateStoreData {
  name?: string;
  address?: string;
  bsale_store_id?: string;
  bsale_api_token?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface AssignMarcaToProviderData {
  store_id: string;
  provider_id: string;
  marca_id: string;
}

export interface InvitationEmailData {
  to: string;
  store_name: string;
  inviter_name: string;
  invitation_url: string;
  role: UserRole;
  expires_at: string;
}

// Context types for multi-store provider experience
export interface StoreContext {
  current_store_id?: string;
  accessible_stores: UserStoreAccess[];
  default_store_id?: string;
}

export interface ProviderDashboardData {
  stores: Array<{
    store_id: string;
    store_name: string;
    marca_name?: string;
    product_count: number;
    recent_sales_count: number;
    low_stock_alerts: number;
  }>;
  total_products: number;
  total_sales: number;
  total_alerts: number;
}

// Error types
export interface InvitationError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class InvitationValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'InvitationValidationError';
  }
}

export class InvitationExpiredError extends Error {
  constructor(message: string = 'Invitation has expired') {
    super(message);
    this.name = 'InvitationExpiredError';
  }
}

export class InvitationNotFoundError extends Error {
  constructor(message: string = 'Invitation not found') {
    super(message);
    this.name = 'InvitationNotFoundError';
  }
}

export class StoreAccessDeniedError extends Error {
  constructor(message: string = 'Access to store denied') {
    super(message);
    this.name = 'StoreAccessDeniedError';
  }
}
