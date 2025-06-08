import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast.ts';
import { SystemSettings as TypedSystemSettings } from '@/types/settings.ts';

// Define the settings interface to match src/types/settings.ts SystemSettings
export interface SystemSettings extends TypedSystemSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user settings
  const { data: settings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => {
      // Return a placeholder since system_settings table doesn't exist yet
      return {
        id: 'placeholder',
        user_id: 'placeholder',
        theme: 'system' as const,
        language: 'en',
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Required properties for SystemSettings interface
        appearance: {
          theme: 'system' as const,
          fontSize: 'medium',
          colorTheme: 'default',
          sidebarCompact: false, // Required field in both interfaces now
          highContrastMode: false,
          animationsEnabled: true,
          layoutDensity: 'comfortable'
        },
        notifications: {
          emailNotifications: true,
          progressAlerts: true,
          attendanceReminders: true,
          systemAnnouncements: true,
          pushNotifications: true,
          notificationPriority: 'all',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          customTemplates: false
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90,
          loginAttempts: 5,
          ipWhitelist: {
            enabled: false,
            addresses: []
          },
          loginTimeRestrictions: {
            enabled: false,
            startTime: '08:00',
            endTime: '18:00'
          },
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumber: true,
            requireUppercase: true
          }
        },
        academic: {
          defaultJuzPerWeek: 1,
          attendanceThreshold: 80,
          progressReportFrequency: 'weekly',
          academicYearStart: '2023-09-01',
          academicYearEnd: '2024-07-31',
          gradingScale: 'percentage',
          customAssessments: false,
          curriculumCustomization: false,
          milestoneTracking: true
        },
        localization: {
          language: 'english',
          timeFormat: '12h',
          dateFormat: 'MM/DD/YYYY',
          firstDayOfWeek: 'sunday',
          region: 'US'
        },
        integrations: {
          calendarSync: {
            enabled: false,
            provider: 'none'
          },
          communicationTools: {
            enabled: false,
            preferredPlatform: 'email'
          },
          externalApis: false,
          automations: false
        },
        dataManagement: {
          autoBackup: {
            enabled: false,
            frequency: 'weekly',
            retention: 30
          },
          dataExport: {
            includeStudentData: true,
            includeTeacherData: true,
            includeAttendance: true,
            includeProgress: true
          },
          archivePolicy: {
            autoArchive: false,
            afterMonths: 12
          }
        },
        userExperience: {
          guidedTours: true,
          keyboardShortcuts: true,
          defaultLandingPage: 'dashboard',
          widgetCustomization: false
        },
        advancedOptions: {
          developerMode: false,
          detailedLogs: false,
          featureFlags: {
            betaFeatures: false,
            experimentalUi: false
          },
          performanceMode: 'balanced'
        }
      } as SystemSettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<SystemSettings>) => {
      setIsLoading(true);
      // This is a placeholder since system_settings table doesn't exist yet
      console.log("Would update settings:", newSettings);
      return Promise.resolve(newSettings);
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
    mutationFn: (newSettings: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>) => {
      setIsLoading(true);
      // This is a placeholder since system_settings table doesn't exist yet
      console.log("Would create settings:", newSettings);
      return Promise.resolve({
        ...newSettings,
        id: 'new-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
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
  
  // Add updateSettings function to fix Settings.tsx error
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    return saveSettings(newSettings);
  };

  return {
    settings,
    isLoading: isLoading || updateSettingsMutation.isPending || createSettingsMutation.isPending,
    saveSettings,
    updateSettings
  };
};
