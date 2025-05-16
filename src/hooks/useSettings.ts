
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define the settings interface to match src/types/settings.ts SystemSettings
export interface SystemSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
  
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize?: string;
    colorScheme?: string;
    sidebarCompact?: boolean;
    highContrastMode?: boolean;
    animationsEnabled?: boolean;
    colorTheme?: string;
    layoutDensity?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  security?: {
    twoFactor?: boolean;
    passwordReset?: boolean;
  };
  academic?: {
    grading?: string;
    progress?: string;
  };
  data?: {
    sync?: boolean;
    export?: boolean;
  };
  integrations?: {
    apis?: string[];
  };
  localization?: {
    language?: string;
    dateFormat?: string;
  };
  userExperience?: {
    onboarding?: boolean;
    tips?: boolean;
  };
  advancedOptions?: {
    developerMode?: boolean;
    debugMode?: boolean;
  };
  dataManagement?: {
    retentionPeriod?: number;
    backupFrequency?: string;
  };
}

export const useSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user settings
  const { data: settings, isError, error } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      // Return a placeholder since system_settings table doesn't exist yet
      return {
        id: 'placeholder',
        user_id: 'placeholder',
        theme: 'system' as const,
        language: 'en',
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {},
        
        // Required properties for SystemSettings interface
        appearance: {
          theme: 'system' as const,
          fontSize: 'medium',
          colorScheme: 'default',
          sidebarCompact: false,
          highContrastMode: false,
          animationsEnabled: true,
          colorTheme: 'default',
          layoutDensity: 'normal'
        },
        notifications: {
          email: true,
          push: true,
          inApp: true,
        },
        security: {
          twoFactor: false,
          passwordReset: true,
        },
        academic: {
          grading: 'standard',
          progress: 'weekly',
        },
        data: {
          sync: true,
          export: true,
        },
        integrations: {
          apis: [],
        },
        localization: {
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
        },
        userExperience: {
          onboarding: true,
          tips: true,
        },
        advancedOptions: {
          developerMode: false,
          debugMode: false,
        },
        dataManagement: {
          retentionPeriod: 90,
          backupFrequency: 'weekly',
        },
      } as SystemSettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      setIsLoading(true);
      // This is a placeholder since system_settings table doesn't exist yet
      console.log("Would update settings:", newSettings);
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      setIsLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Error Updating Settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  });

  // Create settings mutation
  const createSettingsMutation = useMutation({
    mutationFn: async (newSettings: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>) => {
      setIsLoading(true);
      // This is a placeholder since system_settings table doesn't exist yet
      console.log("Would create settings:", newSettings);
      return {
        ...newSettings,
        id: 'new-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: "Settings Created",
        description: "Your settings have been created successfully.",
      });
      setIsLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Error Creating Settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  });

  // Function to save settings
  const saveSettings = (newSettings: Partial<SystemSettings>) => {
    if (settings?.id) {
      updateSettingsMutation.mutate(newSettings);
    } else {
      createSettingsMutation.mutate(newSettings as Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>);
    }
    
    return {
      success: true
    };
  };

  return {
    settings,
    isLoading: isLoading || updateSettingsMutation.isPending || createSettingsMutation.isPending,
    isError,
    error,
    saveSettings
  };
};
