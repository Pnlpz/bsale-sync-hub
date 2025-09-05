/**
 * Hook for completing user invitation and linking profile to auth user
 * This replaces the temporary user_id with the actual auth user_id
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompleteInvitationData {
  invitationToken: string;
  authUserId: string;
}

const completeInvitation = async (data: CompleteInvitationData) => {
  // Step 1: Validate invitation token
  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .select(`
      *,
      profiles!invitations_locatario_id_fkey (
        id,
        name,
        email,
        user_id
      )
    `)
    .eq('token', data.invitationToken)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invitationError || !invitation) {
    throw new Error('Invitación inválida o expirada');
  }

  // Step 2: Update profile with real auth user_id
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      user_id: data.authUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitation.locatario_id);

  if (profileUpdateError) {
    throw new Error(`Error al actualizar perfil: ${profileUpdateError.message}`);
  }

  // Step 3: Mark invitation as accepted
  const { error: invitationUpdateError } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  if (invitationUpdateError) {
    console.warn('Could not update invitation status:', invitationUpdateError);
    // Don't fail the process for this
  }

  // Step 4: Get updated profile with store information
  const { data: updatedProfile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      stores!stores_locatario_id_fkey (
        id,
        name,
        address
      )
    `)
    .eq('id', invitation.locatario_id)
    .single();

  if (profileError) {
    throw new Error(`Error al obtener perfil actualizado: ${profileError.message}`);
  }

  return {
    profile: updatedProfile,
    invitation: invitation,
    store: updatedProfile.stores,
  };
};

export const useCompleteInvitation = () => {
  return useMutation({
    mutationFn: completeInvitation,
    onSuccess: (data) => {
      console.log('Invitation completed successfully:', data);
    },
    onError: (error) => {
      console.error('Error completing invitation:', error);
    },
  });
};

// Utility function to validate invitation token without completing it
export const validateInvitationToken = async (token: string) => {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      profiles!invitations_locatario_id_fkey (
        name,
        email
      ),
      stores!invitations_store_id_fkey (
        name,
        address
      )
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invitación inválida o expirada' };
  }

  return {
    valid: true,
    invitation: data,
    locatario: data.profiles,
    store: data.stores,
  };
};
