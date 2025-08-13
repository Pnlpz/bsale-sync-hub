/**
 * Invitation Hooks
 * React Query hooks for invitation management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { InvitationService } from '@/services/invitation-service';
import {
  CreateInvitationData,
  InvitationFilters,
  InvitationWithDetails,
  Invitation,
} from '@/types/invitation';

// Query Keys
export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list: (filters: InvitationFilters) => [...invitationKeys.lists(), filters] as const,
  details: () => [...invitationKeys.all, 'detail'] as const,
  detail: (token: string) => [...invitationKeys.details(), token] as const,
  stats: (storeId: string) => [...invitationKeys.all, 'stats', storeId] as const,
  pending: (email: string) => [...invitationKeys.all, 'pending', email] as const,
};

/**
 * Get invitations with filtering
 */
export const useInvitations = (filters: InvitationFilters = {}) => {
  return useQuery({
    queryKey: invitationKeys.list(filters),
    queryFn: () => InvitationService.getInvitations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get invitation by token
 */
export const useInvitationByToken = (token: string) => {
  return useQuery({
    queryKey: invitationKeys.detail(token),
    queryFn: () => InvitationService.getInvitationByToken(token),
    enabled: !!token,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get invitation statistics for a store
 */
export const useInvitationStats = (storeId: string) => {
  return useQuery({
    queryKey: invitationKeys.stats(storeId),
    queryFn: () => InvitationService.getInvitationStats(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get pending invitations for an email
 */
export const usePendingInvitations = (email: string) => {
  return useQuery({
    queryKey: invitationKeys.pending(email),
    queryFn: () => InvitationService.getPendingInvitationsForEmail(email),
    enabled: !!email,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Create invitation mutation
 */
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateInvitationData) => InvitationService.createInvitation(data),
    onSuccess: (invitation: Invitation) => {
      // Invalidate and refetch invitation lists
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitationKeys.stats(invitation.store_id) });
      
      toast({
        title: 'Invitación enviada',
        description: `Se ha enviado una invitación a ${invitation.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al enviar invitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Accept invitation mutation
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (token: string) => InvitationService.acceptInvitation(token),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: invitationKeys.all });
        queryClient.invalidateQueries({ queryKey: ['stores'] });
        queryClient.invalidateQueries({ queryKey: ['user-stores'] });
        
        toast({
          title: 'Invitación aceptada',
          description: 'Te has unido exitosamente a la tienda',
        });
      } else {
        toast({
          title: 'Error al aceptar invitación',
          description: result.error || 'Error desconocido',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al aceptar invitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Cancel invitation mutation
 */
export const useCancelInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationId: string) => InvitationService.cancelInvitation(invitationId),
    onSuccess: () => {
      // Invalidate invitation lists
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      
      toast({
        title: 'Invitación cancelada',
        description: 'La invitación ha sido cancelada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al cancelar invitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Resend invitation mutation
 */
export const useResendInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationId: string) => InvitationService.resendInvitation(invitationId),
    onSuccess: (invitation: Invitation) => {
      // Invalidate invitation lists
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(invitation.token) });
      
      toast({
        title: 'Invitación reenviada',
        description: `Se ha reenviado la invitación a ${invitation.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al reenviar invitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Validate invitation token
 */
export const useValidateInvitation = (token: string) => {
  return useQuery({
    queryKey: ['invitation-validation', token],
    queryFn: () => InvitationService.validateInvitationToken(token),
    enabled: !!token,
    staleTime: 0, // Always fresh
    retry: false,
  });
};

/**
 * Check if email is already invited to store
 */
export const useCheckEmailInvited = (email: string, storeId: string) => {
  return useQuery({
    queryKey: ['email-invited', email, storeId],
    queryFn: () => InvitationService.isEmailInvited(email, storeId),
    enabled: !!email && !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Cleanup expired invitations mutation
 */
export const useCleanupExpiredInvitations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => InvitationService.cleanupExpiredInvitations(),
    onSuccess: (count: number) => {
      // Invalidate invitation lists
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      
      if (count > 0) {
        toast({
          title: 'Invitaciones limpiadas',
          description: `Se marcaron ${count} invitaciones como expiradas`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al limpiar invitaciones',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
