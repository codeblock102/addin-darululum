
import { SystemSettings } from "@/types/settings";

export const DEFAULT_SETTINGS: SystemSettings = {
  appearance: {
    theme: 'light',
    sidebarCompact: false,
    highContrastMode: false,
    animationsEnabled: true,
    fontSize: 'medium',
    colorTheme: 'default',
    layoutDensity: 'comfortable',
  },
  notifications: {
    emailNotifications: true,
    progressAlerts: true,
    attendanceReminders: true,
    systemAnnouncements: true,
    pushNotifications: false,
    notificationPriority: 'all',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    customTemplates: false,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: {
      enabled: false,
      addresses: [],
    },
    loginTimeRestrictions: {
      enabled: false,
      startTime: '08:00',
      endTime: '18:00',
    },
    passwordPolicy: {
      minLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
    },
  },
  academic: {
    defaultJuzPerWeek: 1,
    attendanceThreshold: 75,
    progressReportFrequency: 'weekly',
    academicYearStart: '09-01',
    academicYearEnd: '06-30',
    gradingScale: 'percentage',
    customAssessments: false,
    curriculumCustomization: false,
    milestoneTracking: false,
  },
  localization: {
    language: 'english',
    timeFormat: '12h',
    dateFormat: 'MM/DD/YYYY',
    firstDayOfWeek: 'sunday',
    region: 'US',
  },
  integrations: {
    calendarSync: {
      enabled: false,
      provider: 'none',
    },
    communicationTools: {
      enabled: false,
      preferredPlatform: 'email',
    },
    externalApis: false,
    automations: false,
  },
  dataManagement: {
    autoBackup: {
      enabled: false,
      frequency: 'weekly',
      retention: 30,
    },
    dataExport: {
      includeStudentData: true,
      includeTeacherData: true,
      includeAttendance: true,
      includeProgress: true,
    },
    archivePolicy: {
      autoArchive: false,
      afterMonths: 6,
    },
  },
  userExperience: {
    guidedTours: true,
    keyboardShortcuts: false,
    defaultLandingPage: 'dashboard',
    widgetCustomization: false,
  },
  advancedOptions: {
    developerMode: false,
    detailedLogs: false,
    featureFlags: {
      betaFeatures: false,
      experimentalUi: false,
    },
    performanceMode: 'balanced',
  },
};
