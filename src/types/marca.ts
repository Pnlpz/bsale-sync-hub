/**
 * Marca (Brand) related types and interfaces
 */

export interface Marca {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MarcaWithStats extends Marca {
  product_count: number;
  total_sales: number;
  active_products: number;
}

export interface CreateMarcaData {
  name: string;
  description?: string;
}

export interface UpdateMarcaData {
  name?: string;
  description?: string;
}

// Product with marca information
export interface ProductWithMarca {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  proveedor_id: string;
  store_id: string;
  marca_id?: string;
  bsale_product_id?: string;
  created_at: string;
  updated_at: string;
  marca?: Marca;
}

// User profile with marca information
export interface ProfileWithMarca {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'proveedor' | 'locatario' | 'admin';
  store_id?: string;
  proveedor_id?: string;
  marca_id?: string;
  created_at: string;
  updated_at: string;
  marca?: Marca;
}

// Filter options for products based on user role and marca
export interface ProductFilterOptions {
  marca_id?: string;
  proveedor_id?: string;
  store_id?: string;
  search_term?: string;
  include_inactive?: boolean;
}

// Marca access permissions
export interface MarcaPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage_products: boolean;
}
