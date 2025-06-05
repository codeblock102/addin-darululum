import React from 'react';
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { LocalizationSettings } from "@/types/settings.ts";
import { Globe } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";

interface LocalizationSettingsSectionProps {
  settings: LocalizationSettings;
  onUpdate: (settings: LocalizationSettings) => void;
}

export function LocalizationSettingsSection({ settings, onUpdate }: LocalizationSettingsSectionProps) {
  const handleChange = <K extends keyof LocalizationSettings>(key: K, value: LocalizationSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="Localization"
      description="Configure language and regional preferences"
      icon={<Globe className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-medium">Language</Label>
          <Select 
            value={settings.language}
            onValueChange={(value: LocalizationSettings['language']) => handleChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
              <SelectItem value="urdu">Urdu</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Interface language for the application</p>
        </div>
        
        <div className="space-y-2">
          <Label className="font-medium">Time Format</Label>
          <RadioGroup
            value={settings.timeFormat}
            onValueChange={(value: LocalizationSettings['timeFormat']) => handleChange('timeFormat', value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12h" id="time-12h" />
              <Label htmlFor="time-12h">12-hour (AM/PM)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24h" id="time-24h" />
              <Label htmlFor="time-24h">24-hour</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label className="font-medium">Date Format</Label>
          <RadioGroup
            value={settings.dateFormat}
            onValueChange={(value: LocalizationSettings['dateFormat']) => handleChange('dateFormat', value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MM/DD/YYYY" id="date-us" />
              <Label htmlFor="date-us">MM/DD/YYYY (US)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DD/MM/YYYY" id="date-eu" />
              <Label htmlFor="date-eu">DD/MM/YYYY (EU)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="YYYY-MM-DD" id="date-iso" />
              <Label htmlFor="date-iso">YYYY-MM-DD (ISO)</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label className="font-medium">First Day of Week</Label>
          <Select 
            value={settings.firstDayOfWeek}
            onValueChange={(value: LocalizationSettings['firstDayOfWeek']) => handleChange('firstDayOfWeek', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select first day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">Sunday</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="region" className="font-medium">Region Code</Label>
          <Input
            id="region"
            value={settings.region}
            onChange={(e) => handleChange('region', e.target.value)}
            placeholder="US, UK, AE, etc."
            maxLength={2}
            className="w-24 uppercase"
          />
          <p className="text-xs text-muted-foreground">ISO country code for regional settings</p>
        </div>
      </div>
    </SettingsCard>
  );
}
