/**
 * @file src/config/defaultSettings.ts
 * @summary This file defines the default system settings for the application.
 * 
 * It exports a `DEFAULT_SETTINGS` constant, which is an object conforming to the `SystemSettings` type.
 * This object provides the initial values for various application settings, categorized into sections like:
 * - `appearance`: Theme, layout, font size, animations.
 * - `notifications`: Email, push notifications, alerts, quiet hours.
 * - `security`: Two-factor authentication, session timeout, password policies.
 * - `academic`: Default academic parameters, grading, curriculum settings.
 * - `localization`: Language, date/time formats, region.
 * - `integrations`: Calendar sync, communication tools.
 * - `dataManagement`: Backup policies, data export options, archiving.
 * - `userExperience`: Guided tours, keyboard shortcuts, default landing page.
 * - `advancedOptions`: Developer mode, detailed logs, feature flags.
 *
 * These default settings are likely used when a user first uses the application or when specific settings
 * have not yet been customized by an administrator or user.
 */

import { SystemSettings } from "@/types/settings";

/**
 * @const DEFAULT_SETTINGS
 * @description An object containing the default values for all system settings.
 * This configuration is used as the baseline for application behavior and can be overridden
 * by user-specific or admin-configured settings.
 */
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
