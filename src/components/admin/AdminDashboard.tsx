/**
 * @file src/components/admin/AdminDashboard.tsx
 * @summary Admin portal main dashboard container with stats, messaging, and navigation.
 */

import { EnhancedAdminDashboard } from "./EnhancedAdminDashboard";
import { AdminDashboardContent } from "./AdminDashboardContent";

export const AdminDashboard = () => {
  return (
    <EnhancedAdminDashboard
      title="Admin Dashboard"
      description="Manage your madrassah operations and monitor progress"
      badge="Administrator"
    >
      <AdminDashboardContent />
    </EnhancedAdminDashboard>
  );
};
