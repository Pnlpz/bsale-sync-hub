/**
 * Admin Redirect Component
 * Redirects admins to /admin and shows Dashboard for locatarios/proveedores
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRedirect = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for profile to load
    if (isLoading) return;

    // Redirect based on user role
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (profile?.role === 'locatario' || profile?.role === 'proveedor') {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isLoading, navigate]);

  // Show loading while checking user role and redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    </div>
  );
};

export default AdminRedirect;
