/**
 * @file src/hooks/useDashboardNavigation.ts
 * @summary Provides navigation helpers for the dashboard.
 */
import { useState } from "react";

export const useActiveTab = (initialTab: string) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  return { activeTab, setActiveTab };
};
