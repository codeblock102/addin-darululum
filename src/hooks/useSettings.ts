
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemSettings } from "@/types/settings";

const DEFAULT_SETTINGS: SystemSettings = {
  appearance: {
    theme: 'light',
    sidebarCompact: false,
    highContrastMode: false,
    animationsEnabled: true,
  },
  notifications: {
    emailNotifications: true,
    progressAlerts: true,
    attendanceReminders: true,
    systemAnnouncements: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    loginAttempts: 5,
  },
  academic: {
    defaultJuzPerWeek: 1,
    attendanceThreshold: 75,
    progressReportFrequency: 'weekly',
    academicYearStart: '09-01',
    academicYearEnd: '06-30',
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(data.settings as SystemSettings),
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: SystemSettings) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({ id: 1, settings: newSettings });
      
      if (error) throw error;
      
      setSettings(newSettings);
      return { success: true };
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update settings");
      return { success: false, error: "Failed to update settings" };
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, updateSettings, isLoading, error };
}
