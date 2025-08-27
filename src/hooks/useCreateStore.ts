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
    bsale_store_id: string;
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
  if (!data.storeData.bsale_store_id || !data.storeData.bsale_store_id.trim()) {
    throw new Error('El ID de Tienda Bsale es requerido');
  }

  if (!data.storeData.bsale_api_token || !data.storeData.bsale_api_token.trim()) {
    throw new Error('El Token API Bsale es requerido');
  }

  try {
    // Step 1: Create the store
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: data.storeData.name,
        address: data.storeData.address,
        bsale_store_id: data.storeData.bsale_store_id,
        bsale_api_token: data.storeData.bsale_api_token,
        is_active: true,
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      throw new Error(`Error al crear la tienda: ${storeError.message}`);
    }

    // Step 2: Create auth user for locatario
    const tempPassword = generateTempPassword();
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.locatarioData.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      // Clean up store if user creation fails
      await supabase.from('stores').delete().eq('id', newStore.id);
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    // Step 3: Create locatario profile with store assignment
    const { data: locatarioProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        name: data.locatarioData.name,
        email: data.locatarioData.email,
        role: 'locatario',
        store_id: newStore.id, // Assign store directly in profile
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up auth user and store
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('stores').delete().eq('id', newStore.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    // Step 4: Create invitation record (optional, for tracking)
    let invitation = null;
    try {
      const invitationToken = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours from now

      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email: data.locatarioData.email,
          token: invitationToken,
          role: 'locatario',
          store_id: newStore.id,
          invited_by: currentUser.user.id,
          expires_at: expiresAt.toISOString(),
          status: 'accepted', // Mark as accepted since user is created directly
        })
        .select()
        .single();

      if (!invitationError) {
        invitation = invitationData;
      }
    } catch (invitationError) {
      console.error('Error creating invitation record:', invitationError);
      // Don't fail the entire process for invitation error, just log it
    }

    // Step 5: Send welcome email with login instructions
    try {
      await EmailService.sendLocatarioWelcomeEmail({
        to: data.locatarioData.email,
        locatario_name: data.locatarioData.name,
        store_name: data.storeData.name,
        login_url: `${window.location.origin}/auth`,
        temp_password: tempPassword,
        admin_contact: 'admin@bsale-sync.com', // TODO: Make this configurable
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the process for email error
    }

    return {
      store: newStore,
      locatario: locatarioProfile,
      invitation: invitation,
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
