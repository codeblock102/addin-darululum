
import { useState, useEffect } from "react";
import { SystemSettings } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_SETTINGS } from "@/config/defaultSettings";

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  // Load settings when component mounts
  useEffect(() => {
    async function loadSettings() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('settings')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        } else {
          // Initialize settings for new user
          await supabase
            .from('system_settings')
            .insert([{ 
              user_id: session.user.id,
              settings: DEFAULT_SETTINGS 
            }]);
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [session?.user]);

  const updateSettings = async (newSettings: SystemSettings) => {
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          user_id: session.user.id,
          settings: newSettings,
          updated_at: new Date().toISOString()
        });

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
