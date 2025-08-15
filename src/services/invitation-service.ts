/**
 * Invitation Service
 * Handles invitation creation, management, and acceptance
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Invitation,
  InvitationWithDetails,
  CreateInvitationData,
  InvitationFilters,
  InvitationAcceptanceResult,
  InvitationValidationError,
  InvitationExpiredError,
  InvitationNotFoundError,
} from '@/types/invitation';

export class InvitationService {
  /**
   * Create a new invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (data.expires_in_hours || 72)); // Default 72 hours

    // Get current user profile to set invited_by
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) {
      throw new InvitationValidationError('User profile not found', 'PROFILE_NOT_FOUND');
    }

    // Generate invitation token
    const { data: tokenResult } = await supabase.rpc('generate_invitation_token');
    
    if (!tokenResult) {
      throw new InvitationValidationError('Failed to generate invitation token', 'TOKEN_GENERATION_FAILED');
    }

    const invitationData = {
      email: data.email.toLowerCase(),
      store_id: data.store_id,
      invited_by: profile.id,
      role: data.role || 'proveedor',
      token: tokenResult,
      expires_at: expiresAt.toISOString(),
      metadata: data.metadata || {},
    };

    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      throw new InvitationValidationError(
        `Failed to create invitation: ${error.message}`,
        'CREATION_FAILED',
        { error }
      );
    }

    return invitation;
  }

  /**
   * Get invitations with optional filtering
   */
  static async getInvitations(filters: InvitationFilters = {}): Promise<InvitationWithDetails[]> {
    let query = supabase
      .from('invitations')
      .select(`
        *,
        store:stores(id, name, address),
        inviter:profiles!invitations_invited_by_fkey(id, name, email),
        accepter:profiles!invitations_accepted_by_fkey(id, name, email)
      `);

    if (filters.store_id) {
      query = query.eq('store_id', filters.store_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<InvitationWithDetails | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        store:stores(id, name, address),
        inviter:profiles!invitations_invited_by_fkey(id, name, email)
      `)
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch invitation: ${error.message}`);
    }

    return data;
  }

  /**
   * Accept an invitation
   */
  static async acceptInvitation(token: string): Promise<InvitationAcceptanceResult> {
    // Get current user profile
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new InvitationValidationError('User not authenticated', 'NOT_AUTHENTICATED');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    if (!profile) {
      throw new InvitationValidationError('User profile not found', 'PROFILE_NOT_FOUND');
    }

    // Use the database function to accept the invitation
    const { data: result, error } = await supabase.rpc('accept_invitation', {
      invitation_token: token,
      user_profile_id: profile.id,
    });

    if (error) {
      throw new InvitationValidationError(
        `Failed to accept invitation: ${error.message}`,
        'ACCEPTANCE_FAILED',
        { error }
      );
    }

    return result;
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) {
      throw new Error(`Failed to cancel invitation: ${error.message}`);
    }
  }

  /**
   * Resend an invitation (creates a new token and extends expiry)
   */
  static async resendInvitation(invitationId: string): Promise<Invitation> {
    // Generate new token
    const { data: tokenResult } = await supabase.rpc('generate_invitation_token');
    
    if (!tokenResult) {
      throw new InvitationValidationError('Failed to generate invitation token', 'TOKEN_GENERATION_FAILED');
    }

    // Extend expiry by 72 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const { data: invitation, error } = await supabase
      .from('invitations')
      .update({
        token: tokenResult,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resend invitation: ${error.message}`);
    }

    return invitation;
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    const { data: count, error } = await supabase.rpc('cleanup_expired_invitations');

    if (error) {
      throw new Error(`Failed to cleanup expired invitations: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Validate invitation token
   */
  static async validateInvitationToken(token: string): Promise<{
    valid: boolean;
    invitation?: InvitationWithDetails;
    error?: string;
  }> {
    try {
      const invitation = await this.getInvitationByToken(token);
      
      if (!invitation) {
        return { valid: false, error: 'Invitation not found' };
      }

      if (invitation.status !== 'pending') {
        return { valid: false, error: `Invitation is ${invitation.status}` };
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return { valid: false, error: 'Invitation has expired' };
      }

      return { valid: true, invitation };
    } catch (error) {
      return { valid: false, error: 'Failed to validate invitation' };
    }
  }

  /**
   * Get invitation statistics for a store
   */
  static async getInvitationStats(storeId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    const { data, error } = await supabase
      .from('invitations')
      .select('status')
      .eq('store_id', storeId);

    if (error) {
      throw new Error(`Failed to fetch invitation stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0,
    };

    data.forEach((invitation) => {
      stats[invitation.status as keyof typeof stats]++;
    });

    return stats;
  }

  /**
   * Check if email is already invited to store
   */
  static async isEmailInvited(email: string, storeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('store_id', storeId)
      .in('status', ['pending', 'accepted'])
      .limit(1);

    if (error) {
      throw new Error(`Failed to check invitation status: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Get pending invitations for an email
   */
  static async getPendingInvitationsForEmail(email: string): Promise<InvitationWithDetails[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        store:stores(id, name, address),
        inviter:profiles!invitations_invited_by_fkey(id, name, email)
      `)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pending invitations: ${error.message}`);
    }

    return data || [];
  }
}
