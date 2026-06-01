import { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  exact?: boolean;
  /** Optional section label. When set, a divider + section header is rendered above this item. */
  section?: string;
  /** Optional priority (1-4) for placement in the mobile bottom tab bar. Lower = higher priority. Items without priority appear in the "More" sheet. */
  priority?: number;
}
