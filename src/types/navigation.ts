import { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  exact?: boolean;
  /** Optional section label. When set, a divider + section header is rendered above this item. */
  section?: string;
}
