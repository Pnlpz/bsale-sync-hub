/**
 * Migration Checker Utility
 * Helps diagnose database migration status and provides fallback mechanisms
 */

import { supabase } from '@/integrations/supabase/client';

export interface MigrationStatus {
  hasNewTables: boolean;
  hasFunctions: boolean;
  hasStoreAssignment: boolean;
  currentStructure: 'old' | 'new' | 'mixed' | 'unknown';
  recommendations: string[];
}

export class MigrationChecker {
  /**
   * Check the current migration status
   */
  static async checkMigrationStatus(): Promise<MigrationStatus> {
    const status: MigrationStatus = {
      hasNewTables: false,
      hasFunctions: false,
      hasStoreAssignment: false,
      currentStructure: 'unknown',
      recommendations: [],
    };

    try {
      // Check if new tables exist by trying to query them
      try {
        const { error: storeLocatariosError } = await supabase
          .from('store_locatarios')
          .select('id')
          .limit(1);

        const { error: storeProvidersError } = await supabase
          .from('store_providers')
          .select('id')
          .limit(1);

        // Tables exist if we don't get "relation does not exist" error
        status.hasNewTables = !storeLocatariosError && !storeProvidersError;
      } catch (error) {
        status.hasNewTables = false;
      }

      // Check if new functions exist
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { error: functionError } = await supabase.rpc('get_locatario_store', {
            user_id: user.user.id,
          });

          // Function exists if we don't get "function does not exist" error
          status.hasFunctions = functionError?.code !== '42883';
        }
      } catch (error) {
        status.hasFunctions = false;
      }

      // Check if user has store assignment
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        // Try new structure first
        if (status.hasNewTables) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.user.id)
              .single();

            if (profile) {
              const { data: storeAssignment } = await supabase
                .from('store_locatarios')
                .select('store_id')
                .eq('locatario_id', profile.id)
                .single();

              status.hasStoreAssignment = !!storeAssignment;
            }
          } catch (error) {
            // Ignore errors, will check old structure
          }
        }

        // If no assignment in new structure, check old structure
        if (!status.hasStoreAssignment) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('store_id')
              .eq('user_id', user.user.id)
              .single();

            status.hasStoreAssignment = !!profile?.store_id;
          } catch (error) {
            // User might not have profile
          }
        }
      }

      // Determine current structure
      if (status.hasNewTables && status.hasFunctions) {
        status.currentStructure = 'new';
      } else if (!status.hasNewTables && !status.hasFunctions) {
        status.currentStructure = 'old';
      } else {
        status.currentStructure = 'mixed';
      }

      // Generate recommendations
      status.recommendations = this.generateRecommendations(status);

      return status;

    } catch (error) {
      console.error('Error checking migration status:', error);
      status.currentStructure = 'unknown';
      status.recommendations.push('Error checking migration status. Contact administrator.');
      return status;
    }
  }

  /**
   * Generate recommendations based on migration status
   */
  private static generateRecommendations(status: MigrationStatus): string[] {
    const recommendations: string[] = [];

    switch (status.currentStructure) {
      case 'old':
        recommendations.push('Database migration not applied. Apply the multi-tenant migration.');
        recommendations.push('Contact administrator to run the database migration.');
        break;

      case 'new':
        if (!status.hasStoreAssignment) {
          recommendations.push('Migration applied but no store assigned to user.');
          recommendations.push('Contact administrator to assign a store to your account.');
        } else {
          recommendations.push('System is up to date and properly configured.');
        }
        break;

      case 'mixed':
        recommendations.push('Partial migration detected. Complete the migration process.');
        recommendations.push('Some database changes are missing. Re-run the migration.');
        break;

      case 'unknown':
        recommendations.push('Unable to determine migration status.');
        recommendations.push('Contact administrator for system diagnosis.');
        break;
    }

    return recommendations;
  }

  /**
   * Get user's store using fallback mechanisms
   */
  static async getUserStore(): Promise<{
    success: boolean;
    store?: any;
    method: 'new_function' | 'old_structure' | 'none';
    error?: string;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, method: 'none', error: 'User not authenticated' };
      }

      // Try new function first (only if it exists)
      try {
        const { data: storeData, error: functionError } = await supabase.rpc('get_locatario_store', {
          user_id: user.user.id,
        });

        // If function doesn't exist, we'll get a 404 or function not found error
        if (functionError?.code === '42883') {
          console.log('get_locatario_store function does not exist, using fallback...');
        } else if (!functionError && storeData && storeData.length > 0) {
          return {
            success: true,
            store: storeData[0],
            method: 'new_function',
          };
        }
      } catch (error: any) {
        console.log('New function not available, trying fallback...', error.message);
      }

      // Fallback to old structure
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            store_id,
            stores (
              id,
              name,
              address
            )
          `)
          .eq('user_id', user.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return {
            success: false,
            method: 'old_structure',
            error: `Profile error: ${profileError.message}`,
          };
        }

        if (!profile?.store_id) {
          return {
            success: false,
            method: 'old_structure',
            error: 'No store assigned to user in profile',
          };
        }

        return {
          success: true,
          store: {
            store_id: profile.store_id,
            store_name: profile.stores?.name,
            store_address: profile.stores?.address,
          },
          method: 'old_structure',
        };
      } catch (error: any) {
        console.error('Error in fallback method:', error);
        return {
          success: false,
          method: 'old_structure',
          error: `Fallback error: ${error.message}`,
        };
      }

    } catch (error: any) {
      return {
        success: false,
        method: 'none',
        error: error.message,
      };
    }
  }
}

// Helper function to check if tables exist (needs to be created as DB function)
export const createTableExistsFunction = `
CREATE OR REPLACE FUNCTION public.check_table_exists(table_names TEXT[])
RETURNS TEXT[] AS $$
DECLARE
  existing_tables TEXT[] := '{}';
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY table_names
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      existing_tables := array_append(existing_tables, table_name);
    END IF;
  END LOOP;
  
  RETURN existing_tables;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
