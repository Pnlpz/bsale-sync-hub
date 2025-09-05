/**
 * Create Store Hook
 * Handles store creation, locatario assignment, and invitation sending
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/services/email-service';

export interface CreateStoreData {
  storeData: {
    name: string;
    address: string;
    bsale_api_token: string;
  };
  locatarioData: {
    name: string;
    email: string;
  };
}

export interface CreateStoreResult {
  store: any;
  locatario: any;
  invitation: any;
}

const createStoreWithLocatario = async (data: CreateStoreData): Promise<CreateStoreResult> => {
  // Verify admin permissions
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', currentUser.user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw new Error('Solo los administradores pueden crear tiendas');
  }

  // Check if email is already registered
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const emailExists = existingUser.users?.some(user => user.email === data.locatarioData.email);

  if (emailExists) {
    throw new Error('Ya existe un usuario registrado con este correo electrónico');
  }

  // Check if store name already exists
  const { data: existingStore } = await supabase
    .from('stores')
    .select('id')
    .eq('name', data.storeData.name)
    .single();

  if (existingStore) {
    throw new Error('Ya existe una tienda con este nombre');
  }

  // Validate required API configuration
  if (!data.storeData.bsale_api_token || !data.storeData.bsale_api_token.trim()) {
    throw new Error('El Token API Bsale es requerido');
  }

  try {
    // Step 1: Get Bsale store ID using the API token (optional for now)
    let bsaleStoreId = null;
    try {
      bsaleStoreId = await getBsaleStoreId(data.storeData.bsale_api_token);
      console.log('Successfully obtained Bsale store ID:', bsaleStoreId);
    } catch (bsaleError) {
      console.warn('Could not get Bsale store ID, continuing without it:', bsaleError);
      // Continue without Bsale integration for now
      bsaleStoreId = null;
    }

    // Step 2: Create locatario profile - REQUIRES SQL SETUP FIRST
    const invitationToken = generateInvitationToken();

    // This will fail until the SQL script is run to fix the database constraints
    const { data: newLocatario, error: locatarioError } = await supabase
      .from('profiles')
      .insert({
        name: data.locatarioData.name,
        email: data.locatarioData.email,
        role: 'locatario',
        // user_id will be null - requires running emergency-fix-profiles.sql first
      })
      .select()
      .single();

    if (locatarioError) {
      console.error('Error creating locatario profile:', locatarioError);

      // Check if it's the foreign key constraint error
      if (locatarioError.message?.includes('foreign key constraint') ||
          locatarioError.message?.includes('not-null constraint')) {
        throw new Error(`
❌ Error de configuración de base de datos.

🔧 SOLUCIÓN REQUERIDA:
1. Ve al SQL Editor de Supabase
2. Ejecuta el script: emergency-fix-profiles.sql
3. Esto eliminará las restricciones que impiden crear perfiles sin usuarios auth

📋 Script a ejecutar:
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

⚠️  Sin este cambio, no se pueden crear tiendas.

Error original: ${locatarioError.message}
        `);
      }

      throw new Error(`Error al crear el perfil del locatario: ${locatarioError.message}`);
    }

    // Step 4: Create the store with locatario assigned
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: data.storeData.name,
        address: data.storeData.address,
        locatario_id: newLocatario.id,
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      // Clean up created profile
      await supabase.from('profiles').delete().eq('id', newLocatario.id);
      throw new Error(`Error al crear la tienda: ${storeError.message}`);
    }

    // Step 5: Create Bsale configuration in separate table
    if (data.storeData.bsale_api_token) {
      try {
        const { error: bsaleConfigError } = await supabase
          .from('bsale_config')
          .insert({
            store_id: newStore.id,
            bsale_store_id: bsaleStoreId,
            bsale_api_token: data.storeData.bsale_api_token,
            is_active: true,
          });

        if (bsaleConfigError) {
          console.warn('Could not create Bsale configuration:', bsaleConfigError);
          // Continue with store creation even if Bsale config fails
        } else {
          console.log('Successfully created Bsale configuration for store');
        }
      } catch (bsaleError) {
        console.warn('Could not create Bsale configuration:', bsaleError);
        // Continue with store creation even if Bsale config fails
      }
    }

    // Step 6: Update locatario profile with store assignment (if needed)
    if (newLocatario && newStore) {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ store_id: newStore.id })
          .eq('id', newLocatario.id);

        if (updateError) {
          console.warn('Could not update locatario with store assignment:', updateError);
          // Continue anyway, the relationship is established through locatario_id in stores
        }
      } catch (updateError) {
        console.warn('Could not update locatario with store assignment:', updateError);
      }
    }

    // Step 7: Create invitation record for manual invitation process
    let invitation = null;
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours from now

      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email: data.locatarioData.email,
          token: invitationToken,
          role: 'locatario',
          store_id: newStore.id,
          locatario_id: newLocatario.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending', // Pending until user completes registration
        })
        .select()
        .single();

      if (!invitationError) {
        invitation = invitationData;
        console.log('Invitation record created successfully');
      }
    } catch (invitationError) {
      console.error('Error creating invitation record:', invitationError);
      // Don't fail the entire process for invitation error, just log it
    }

    // Step 8: Send invitation email automatically
    try {
      const currentUser = await supabase.auth.getUser();
      const adminName = currentUser.data.user?.user_metadata?.name || 'Administrador';

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await EmailService.sendInvitationEmail({
        to: data.locatarioData.email,
        inviter_name: adminName,
        store_name: data.storeData.name,
        role: 'locatario',
        invitation_url: `${window.location.origin}/auth/register?token=${invitationToken}`,
        expires_at: expiresAt.toISOString(),
      });

      console.log('✅ Invitation email sent successfully to:', data.locatarioData.email);

    } catch (emailError) {
      console.warn('⚠️ Could not send invitation email:', emailError);
      // Don't fail the entire process if email fails
      console.log('📧 Manual invitation details:', {
        email: data.locatarioData.email,
        name: data.locatarioData.name,
        storeName: data.storeData.name,
        invitationToken: invitationToken,
        registrationUrl: `${window.location.origin}/auth/register?token=${invitationToken}`,
      });
    }

    return {
      store: newStore,
      locatario: newLocatario,
      invitation: { token: invitationToken },
    };

  } catch (error) {
    console.error('Error in createStoreWithLocatario:', error);
    throw error;
  }
};

// Helper function to generate temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to generate invitation token
const generateInvitationToken = (): string => {
  return crypto.randomUUID();
};

// Helper function to generate temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to get Bsale store ID from API token
const getBsaleStoreId = async (apiToken: string): Promise<string> => {
  try {
    // Call Bsale API to get store information
    const response = await fetch('https://api.bsale.io/v1/offices.json', {
      method: 'GET',
      headers: {
        'access_token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error de API Bsale: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Get the first active office/store
    const activeOffice = data.items?.find((office: any) => office.state === 0); // state 0 = active

    if (!activeOffice) {
      throw new Error('No se encontró una tienda activa en Bsale');
    }

    return activeOffice.id.toString();

  } catch (error) {
    console.error('Error fetching Bsale store ID:', error);
    throw new Error('No se pudo obtener el ID de la tienda desde Bsale. Verifica el token.');
  }
};

export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStoreWithLocatario,
    onSuccess: () => {
      // Invalidate and refetch admin dashboard data
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Store creation failed:', error);
    },
  });
};
