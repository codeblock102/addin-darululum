
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SecuritySettings } from "@/types/settings";
import { Shield } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Input } from "@/components/ui/input";

interface SecuritySettingsSectionProps {
  settings: SecuritySettings;
  onUpdate: (settings: SecuritySettings) => void;
}

export function SecuritySettingsSection({ settings, onUpdate }: SecuritySettingsSectionProps) {
  const handleChange = (key: keyof SecuritySettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="Security"
      description="Configure security and privacy settings"
      icon={<Shield className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="2fa" className="font-medium">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">Require two-factor authentication for all admin users</p>
          </div>
          <Switch
            id="2fa"
            checked={settings.twoFactorAuth}
            onCheckedChange={(checked) => handleChange('twoFactorAuth', checked)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="session-timeout" className="font-medium">Session Timeout</Label>
            <span className="text-sm text-muted-foreground">{settings.sessionTimeout} minutes</span>
          </div>
          <Slider
            id="session-timeout"
            min={15}
            max={240}
            step={15}
            value={[settings.sessionTimeout]}
            onValueChange={(value) => handleChange('sessionTimeout', value[0])}
          />
          <p className="text-xs text-muted-foreground">Automatically log out users after period of inactivity</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password-expiry" className="font-medium">Password Expiry</Label>
          <div className="flex items-center gap-2">
            <Input
              id="password-expiry"
              type="number"
              min={30}
              max={365}
              value={settings.passwordExpiry}
              onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value, 10))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground">Require password change after specified number of days</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="login-attempts" className="font-medium">Maximum Login Attempts</Label>
          <div className="flex items-center gap-2">
            <Input
              id="login-attempts"
              type="number"
              min={3}
              max={10}
              value={settings.loginAttempts}
              onChange={(e) => handleChange('loginAttempts', parseInt(e.target.value, 10))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">attempts</span>
          </div>
          <p className="text-xs text-muted-foreground">Lock account after specified number of failed login attempts</p>
        </div>
      </div>
    </SettingsCard>
  );
}
