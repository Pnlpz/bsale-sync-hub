import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Store,
  Shield
} from 'lucide-react';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    if (profile?.role === 'admin') {
      // Admin menu - no Dashboard or Inventory, focused on administration
      return [
        { icon: Shield, label: 'Panel Admin', path: '/admin' },
        { icon: ShoppingCart, label: 'Ventas', path: '/sales' },
        { icon: Users, label: 'Usuarios', path: '/users' },
        { icon: Store, label: 'Tiendas', path: '/stores' },
        { icon: Settings, label: 'Configuración', path: '/settings' },
      ];
    }

    // Locatario and Proveedor menu - includes Dashboard
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Package, label: 'Inventario', path: '/inventory' },
      { icon: ShoppingCart, label: 'Ventas', path: '/sales' },
      { icon: Settings, label: 'Configuración', path: '/settings' },
    ];

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-primary">Crelo-BSale</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {profile?.role === 'admin' && 'Administrador'}
          {profile?.role === 'proveedor' && 'Proveedor'}
          {profile?.role === 'locatario' && 'Locatario'}
        </p>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4">
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">{profile?.name}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;