/**
 * Admin Dashboard Data Hook
 * Fetches comprehensive data for admin dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminDashboardStats {
  totalLocatarios: number;
  activeLocatarios: number;
  totalProveedores: number;
  activeProveedores: number;
  totalSales: number;
  salesThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

export interface LocatarioData {
  id: string;
  name: string;
  email: string;
  store_name: string;
  store_id: string;
  total_sales: number;
  total_revenue: number;
  proveedores_count: number;
  products_count: number;
  created_at: string;
  last_login: string;
}

export interface ProveedorData {
  id: string;
  name: string;
  email: string;
  stores_count: number;
  total_sales: number;
  total_revenue: number;
  products_count: number;
  stores: string[];
  created_at: string;
  last_login: string;
}

export interface StoreData {
  id: string;
  name: string;
  address: string;
  locatario_name: string;
  locatario_email: string;
  proveedores_count: number;
  products_count: number;
  total_sales: number;
  total_revenue: number;
  bsale_store_id: string;
  api_configured: boolean;
  created_at: string;
}

export interface SalesOverviewData {
  daily_sales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  top_stores: Array<{
    store_name: string;
    sales: number;
    revenue: number;
  }>;
  top_products: Array<{
    product_name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  locatarios: LocatarioData[];
  proveedores: ProveedorData[];
  stores: StoreData[];
  salesOverview: SalesOverviewData;
}

const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  // Fetch basic stats
  const [
    { count: totalLocatarios },
    { count: totalProveedores },
    { count: totalSales },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'locatario'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'proveedor'),
    supabase.from('sales').select('*', { count: 'exact', head: true }),
    supabase.from('sales').select('total_amount')
  ]);

  const totalRevenue = revenueData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

  // Fetch this month's data
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: salesThisMonth },
    { data: revenueThisMonthData }
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .gte('sale_date', startOfMonth.toISOString()),
    supabase
      .from('sales')
      .select('total_amount')
      .gte('sale_date', startOfMonth.toISOString())
  ]);

  const revenueThisMonth = revenueThisMonthData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

  // Fetch detailed locatarios data
  const { data: locatariosData } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      created_at,
      store_id,
      stores (
        id,
        name
      )
    `)
    .eq('role', 'locatario');

  // Fetch sales and provider counts for each locatario
  const locatarios: LocatarioData[] = await Promise.all(
    (locatariosData || []).map(async (locatario) => {
      const storeId = locatario.store_id || locatario.stores?.id;
      
      const [
        { count: salesCount },
        { data: salesRevenue },
        { count: proveedoresCount },
        { count: productsCount }
      ] = await Promise.all([
        supabase.from('sales').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('sales').select('total_amount').eq('store_id', storeId),
        supabase.from('store_providers').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId)
      ]);

      const revenue = salesRevenue?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      return {
        id: locatario.id,
        name: locatario.name,
        email: locatario.email,
        store_name: locatario.stores?.name || 'Sin tienda',
        store_id: storeId,
        total_sales: salesCount || 0,
        total_revenue: revenue,
        proveedores_count: proveedoresCount || 0,
        products_count: productsCount || 0,
        created_at: locatario.created_at,
        last_login: locatario.created_at, // TODO: Add last_login tracking
      };
    })
  );

  // Fetch detailed proveedores data
  const { data: proveedoresData } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      created_at
    `)
    .eq('role', 'proveedor');

  const proveedores: ProveedorData[] = await Promise.all(
    (proveedoresData || []).map(async (proveedor) => {
      const [
        { data: storeRelations },
        { count: salesCount },
        { data: salesRevenue },
        { count: productsCount }
      ] = await Promise.all([
        supabase
          .from('store_providers')
          .select('store_id, stores(name)')
          .eq('provider_id', proveedor.id)
          .eq('is_active', true),
        supabase.from('sales').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedor.id),
        supabase.from('sales').select('total_amount').eq('proveedor_id', proveedor.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedor.id)
      ]);

      const revenue = salesRevenue?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const stores = storeRelations?.map(rel => rel.stores?.name).filter(Boolean) || [];

      return {
        id: proveedor.id,
        name: proveedor.name,
        email: proveedor.email,
        stores_count: storeRelations?.length || 0,
        total_sales: salesCount || 0,
        total_revenue: revenue,
        products_count: productsCount || 0,
        stores,
        created_at: proveedor.created_at,
        last_login: proveedor.created_at, // TODO: Add last_login tracking
      };
    })
  );

  // Fetch stores data
  const { data: storesData } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      address,
      bsale_store_id,
      bsale_api_token,
      created_at,
      store_locatarios (
        locatario_id,
        profiles (
          name,
          email
        )
      )
    `);

  const stores: StoreData[] = await Promise.all(
    (storesData || []).map(async (store) => {
      const [
        { count: proveedoresCount },
        { count: productsCount },
        { count: salesCount },
        { data: salesRevenue }
      ] = await Promise.all([
        supabase.from('store_providers').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
        supabase.from('sales').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
        supabase.from('sales').select('total_amount').eq('store_id', store.id)
      ]);

      const revenue = salesRevenue?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const locatario = store.store_locatarios?.[0]?.profiles;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        locatario_name: locatario?.name || 'Sin asignar',
        locatario_email: locatario?.email || '',
        proveedores_count: proveedoresCount || 0,
        products_count: productsCount || 0,
        total_sales: salesCount || 0,
        total_revenue: revenue,
        bsale_store_id: store.bsale_store_id || '',
        api_configured: !!(store.bsale_store_id && store.bsale_api_token),
        created_at: store.created_at,
      };
    })
  );

  // Fetch sales overview data (simplified for now)
  const salesOverview: SalesOverviewData = {
    daily_sales: [], // TODO: Implement daily sales chart
    top_stores: stores
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5)
      .map(store => ({
        store_name: store.name,
        sales: store.total_sales,
        revenue: store.total_revenue,
      })),
    top_products: [], // TODO: Implement top products
  };

  return {
    stats: {
      totalLocatarios: totalLocatarios || 0,
      activeLocatarios: totalLocatarios || 0, // TODO: Add active status
      totalProveedores: totalProveedores || 0,
      activeProveedores: totalProveedores || 0, // TODO: Add active status
      totalSales: totalSales || 0,
      salesThisMonth: salesThisMonth || 0,
      totalRevenue,
      revenueThisMonth,
    },
    locatarios,
    proveedores,
    stores,
    salesOverview,
  };
};

export const useAdminDashboardData = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
