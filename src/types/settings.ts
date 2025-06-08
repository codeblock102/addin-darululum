export interface SystemSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  academic: AcademicSettings;
  localization: LocalizationSettings;
  integrations: IntegrationSettings;
  dataManagement: DataManagementSettings;
  userExperience: UserExperienceSettings;
  advancedOptions: AdvancedSettings;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  sidebarCompact: boolean;
  highContrastMode: boolean;
  animationsEnabled: boolean;
  fontSize: "small" | "medium" | "large";
  colorTheme: "default" | "blue" | "green" | "purple";
  layoutDensity: "compact" | "comfortable";
}

export interface NotificationSettings {
  emailNotifications: boolean;
  progressAlerts: boolean;
  attendanceReminders: boolean;
  systemAnnouncements: boolean;
  pushNotifications: boolean;
  notificationPriority: "all" | "important" | "critical";
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  customTemplates: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // in minutes
  passwordExpiry: number; // in days
  loginAttempts: number;
  ipWhitelist: {
    enabled: boolean;
    addresses: string[];
  };
  loginTimeRestrictions: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    requireUppercase: boolean;
  };
}

export interface AcademicSettings {
  defaultJuzPerWeek: number;
  attendanceThreshold: number; // percentage
  progressReportFrequency: "daily" | "weekly" | "monthly";
  academicYearStart: string;
  academicYearEnd: string;
  gradingScale: "percentage" | "letter" | "points";
  customAssessments: boolean;
  curriculumCustomization: boolean;
  milestoneTracking: boolean;
}

export interface LocalizationSettings {
  language: "english" | "arabic" | "urdu" | "french" | "spanish";
  timeFormat: "12h" | "24h";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  firstDayOfWeek: "sunday" | "monday" | "saturday";
  region: string;
}

export interface IntegrationSettings {
  calendarSync: {
    enabled: boolean;
    provider: "google" | "outlook" | "apple" | "none";
  };
  communicationTools: {
    enabled: boolean;
    preferredPlatform: "email" | "slack" | "teams" | "discord" | "none";
  };
  externalApis: boolean;
  automations: boolean;
}

export interface DataManagementSettings {
  autoBackup: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    retention: number; // days
  };
  dataExport: {
    includeStudentData: boolean;
    includeTeacherData: boolean;
    includeAttendance: boolean;
    includeProgress: boolean;
  };
  archivePolicy: {
    autoArchive: boolean;
    afterMonths: number;
  };
}

export interface UserExperienceSettings {
  guidedTours: boolean;
  keyboardShortcuts: boolean;
  defaultLandingPage: "dashboard" | "students" | "schedule" | "progress";
  widgetCustomization: boolean;
}

export interface AdvancedSettings {
  developerMode: boolean;
  detailedLogs: boolean;
  featureFlags: {
    betaFeatures: boolean;
    experimentalUi: boolean;
  };
  performanceMode: "balanced" | "performance" | "quality";
}
