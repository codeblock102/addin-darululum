
export interface SystemSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  academic: AcademicSettings;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCompact: boolean;
  highContrastMode: boolean;
  animationsEnabled: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  progressAlerts: boolean;
  attendanceReminders: boolean;
  systemAnnouncements: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // in minutes
  passwordExpiry: number; // in days
  loginAttempts: number;
}

export interface AcademicSettings {
  defaultJuzPerWeek: number;
  attendanceThreshold: number; // percentage
  progressReportFrequency: 'daily' | 'weekly' | 'monthly';
  academicYearStart: string;
  academicYearEnd: string;
}
